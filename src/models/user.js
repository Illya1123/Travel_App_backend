import { Schema, Types, model } from "mongoose"; // Erase if already required
import { genSaltSync, hash, compare } from "bcrypt";
import { randomBytes, createHash } from "crypto";
// Declare the Schema of the Mongo model

const DEFAULT_AVATAR_PATH =
  "https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/c39af4399a87bc3d7701101b728cddc9.jpg";

var userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    mobile: {
      type: String,
    },
    avatar: {
      type: String,
      default: DEFAULT_AVATAR_PATH,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "user",
    },
    cart: {
      type: Array,
      default: [],
    },
    address: [{ type: Types.ObjectId, ref: "Address" }],
    wishlist: [{ type: Types.ObjectId, ref: "Product" }],
    isBlocked: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },
    passwordChangedAt: {
      type: String,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = genSaltSync(10);
  this.password = await hash(this.password, salt);
});
userSchema.methods = {
  isCorrectPassword: async function (password) {
    return await compare(password, this.password);
  },
  createPasswordChangedToken: function () {
    const resetToken = randomBytes(32).toString("hex");
    this.passwordResetToken = createHash("sha256")
      .update(resetToken)
      .digest("hex");
    this.passwordResetExpires = Date.now() + 15 * 60 * 1000;
    return resetToken;
  },
};

//Export the model
export default model("User", userSchema);
