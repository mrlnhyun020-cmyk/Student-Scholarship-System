
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/user");

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error(
      "Usage: node makeAdmin.js student@example.com"
    );
    process.exitCode = 1;
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      console.error(
        "User not found. Register the account first."
      );
      process.exitCode = 1;
      return;
    }

    user.role = "admin";
    await user.save();

    console.log(
      `Admin role assigned to ${user.email}`
    );
  } catch (error) {
    console.error("Could not assign admin role:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

makeAdmin();
