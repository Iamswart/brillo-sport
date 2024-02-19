import { Schema, model, Document } from "mongoose";

export interface ISport extends Document {
  name: string;
  createdAt?: Date;
}

const sportSchema = new Schema<ISport>({
  name: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 50,
  },
  createdAt: { type: Date, default: Date.now },
});

const Sport = model<ISport>("Sport", sportSchema);

export default Sport;
