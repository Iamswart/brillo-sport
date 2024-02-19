import { Request } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import config from "../config/config";
import emailTemplates from "../emailTemplates/emailTemplates";
import { badRequestError } from "../error";
import { updateProfileInterface } from "../interfaces/user";
import logger from "../logger";
import Sport from "../models/sport";
import User from "../models/user";
import { generateVerificationLink } from "../utils/generateVerificationLink";
import Helpers from "../utils/helper";
import { client } from "../utils/redis";
import sqs from "../utils/sqs-consumer";
import TermiiService from "../utils/termii";

export default class UserService {
  private termiiService = new TermiiService();

  async sendEmailVerificationLink(userId: string) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.isEmailVerified) {
      throw new Error("Email already verified");
    }

    const verificationLink = await generateVerificationLink(userId);

    const msgData = {
      notifyBy: ["email"],
      email: user.email,
      subject: "Verify Your Email Address",
      data: {
        token: verificationLink,
        name: `${user.userName}`,
      },
      template: emailTemplates.confirmEmail,
    };

    const sqsOrderData = {
      MessageAttributes: {
        type: {
          DataType: "String",
          StringValue: "email",
        },
      },
      MessageBody: JSON.stringify(msgData),
      QueueUrl: process.env.SQS_QUEUE_URL as string,
    };

    try {
      const data = await sqs.sendMessage(sqsOrderData).promise();
      logger.info(`Email Verification Link sent | SUCCESS: ${data.MessageId}`);
    } catch (error) {
      logger.error(`Error sending Verification Link email: ${error.message}`);
    }
  }

  async verifyEmail(req: Request) {
    const { token } = req.query;

    const decodedToken = Buffer.from(token as string, "base64").toString(
      "ascii"
    );

    const { userId } = jwt.verify(
      decodedToken,
      config.jwtSecret as string
    ) as any;

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.isEmailVerified) {
      throw new Error("Email already verified");
    }

    const verificationToken = await client.get(`email_verification_${userId}`);
    if (!verificationToken || verificationToken !== token) {
      throw new Error("Link expired or incorrect");
    }

    await user.updateOne({ isEmailVerified: true });
    await client.del(`email_verification_${userId}`);

    const msgData = {
      notifyBy: ["email"],
      email: user.email,
      subject: "Email Verification Successful",
      data: {
        name: user.userName,
      },
      template: emailTemplates.verifiedEmailSuccess,
    };

    const sqsOrderData = {
      MessageAttributes: {
        type: {
          DataType: "String",
          StringValue: "email",
        },
      },
      MessageBody: JSON.stringify(msgData),
      QueueUrl: process.env.SQS_QUEUE_URL as string,
    };

    await sqs.sendMessage(sqsOrderData).promise();

    logger.info("Email Verified sent | SUCCESS");

    return {
      user: {
        id: user._id,
        userName: user.userName,
        email: user.email,
      },
    };
  }

  async sendPhoneVerificationCode(userId: string) {

    const user = await User.findById(userId);

    if (!user) {
      throw badRequestError("User not found");
    }

    if (user.isPhoneVerified) {
      throw new Error("Phone already verified");
    }

    const otp = Helpers.generateOtp();

    const message = `Please, confirm your registered phone number on Brillo with this code ${otp}`;

    await client.set(`phone_verification_${userId}`, otp, "EX", 300);

    await this.termiiService.sendSms({
      phone: Helpers.formatNumber("234", user.phone),
      message,
    });

    return process.env.NODE_ENV !== "production" ? { otp } : undefined;
  }

  async verifyPhone(userId: string, token: string) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw badRequestError("User not found");
    }

    if (user.isPhoneVerified) {
      throw badRequestError("Phone Already Verified");
    }

    const otp = await client.get(`phone_verification_${userId}`);

    if (!otp) {
      throw badRequestError("Incorrect Otp or expired");
    }

    if (otp !== token) {
      throw badRequestError("Incorrect Otp");
    }

    await user.updateOne({
      isPhoneVerified: true,
    });

    await client.del(`phone_verification_${userId}`);
  }

  async updateProfile(input: updateProfileInterface, userId: string) {
    const { email, gender, userName } = input;

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    let isModified = false;

    if (userName && userName !== user.userName) {
      const existingUserWithUsername = await User.findOne({ userName });
      if (existingUserWithUsername) {
        throw new Error("Username already in use.");
      }
      user.userName = userName;
      isModified = true;

    }

    if (email && email !== user.email) {
      const existingUserWithEmail = await User.findOne({ email });
      if (existingUserWithEmail) {
        throw new Error("Email already in use.");
      }
      user.email = email;
      user.isEmailVerified = false;
      isModified = true;

      const verificationLink = await generateVerificationLink(userId);
      const msgData = {
        notifyBy: ["email"],
        email: user.email,
        subject: "Verify Your Email Address",
        data: {
          token: verificationLink,
          name: `${user.userName}`,
        },
        template: emailTemplates.confirmEmail,
      };

      const sqsOrderData = {
        MessageAttributes: {
          type: {
            DataType: "String",
            StringValue: "email",
          },
        },
        MessageBody: JSON.stringify(msgData),
        QueueUrl: process.env.SQS_QUEUE_URL as string,
      };

      try {
        const data = await sqs.sendMessage(sqsOrderData).promise();
        logger.info(
          `Email Verification Link sent | SUCCESS: ${data.MessageId}`
        );
      } catch (error) {
        logger.error(`Error sending Verification Link email: ${error.message}`);
      }
    }

    if (gender) {
      user.gender = gender;
      isModified = true;
    }

    if (isModified) {
      user.updatedAt = new Date();
      await user.save();
      return { message: "Profile updated successfully." };
    } else {
      return { message: "No changes made to the profile." };
    }
  }

  async getUserProfile(userId: string) {
    if (!userId) {
      throw badRequestError("User ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw badRequestError("Invalid User ID");
    }

    const userProfile = await User.findOne(
      { _id: userId },
      "userName email phone gender lastLoginAt isEmailVerified isPhoneVerified createdAt updatedAt isAdmin interests"
    )
    .populate({
      path: 'interests',
      select: 'name'
    })
    .exec();

    if (!userProfile) {
      throw badRequestError("User not found");
    }

    return userProfile;
  }

  async updateUserSportsInterests(userId: string, sportIds: string[]) {
    const existingSports = await Sport.find({ _id: { $in: sportIds } });

    const foundSportIds = existingSports.map((sport) => sport._id.toString());

    const notFoundSportIds = sportIds.filter(
      (id) => !foundSportIds.includes(id)
    );

    if (notFoundSportIds.length > 0) {
      throw badRequestError(`Sports not found: ${notFoundSportIds.join(", ")}`);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw badRequestError("User not found.");
    }

    if (!user.interests) {
        user.interests = [];
    }

    user.interests = [...new Set([...user.interests.map(id => id.toString()), ...foundSportIds])];

    user.updatedAt = new Date();

    await user.save();

    await user.populate("interests", "name");

    const addedSportsNames = existingSports.map((sport) => sport.name);
    return {
      addedInterests: addedSportsNames,
    };
}


}
