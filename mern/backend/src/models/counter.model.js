import mongoose from 'mongoose';

// Sequence numbers, e.g. order numbers. $inc is atomic, so two orders placed
// at the same moment can never get the same number.
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, required: true },
});

const Counter = mongoose.model('Counter', counterSchema);

// First call returns start + 1
export const nextSequence = async (name, start = 1000) => {
  await Counter.updateOne({ _id: name }, { $setOnInsert: { seq: start } }, { upsert: true });
  const counter = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { returnDocument: 'after' }
  );
  return counter.seq;
};

export default Counter;
