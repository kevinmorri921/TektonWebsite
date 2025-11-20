import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullname: { 
    type: String, 
    required: true 
  },

  email: { 
    type: String, 
    required: true, 
    unique: true 
  },

  password: { 
    type: String, 
    required: true 
  },

  // NEW ROLE FIELD
  role: {
    type: String,
    enum: ["SUPER_ADMIN", "admin", "encoder", "researcher"],
    default: "researcher"   // normal users can only view maps
  },

  // (Optional) This still works if your old code uses it
  isAdmin: { 
    type: Boolean, 
    default: false 
  },

  lastLoginAt: { 
    type: Date 
  },

  isEnabled: { 
    type: Boolean, 
    default: true 
  }
}, 
{ timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
