import mongoose from 'mongoose';

const expanseSchema = new mongoose.Schema({
   description : {
    type : String,
    required : true
  },
  amount : {
    type : Number,
    required : true
  },
  category: {
    type: String,
    required : true,
  },
  date: {
    type: Date,
    required : true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userinfo",
    required: true,
  },
  type: {
    type: String,
    default: "expense",  
  }, 
},{
    timestamps:true,
})

const expanseModel = mongoose.models.expanse||mongoose.model("expanse",expanseSchema);
export default expanseModel;