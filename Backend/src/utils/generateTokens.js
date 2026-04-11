import UserModel from "../model/User.models.js";

export async function generateAccessAndRefreshTokens(userID) {
  const user = await UserModel.findById(userID);
  if (!user) {
    throw new Error("User not found");
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
}
