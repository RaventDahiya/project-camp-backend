import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;
  //validation
});

export { registerUser };
