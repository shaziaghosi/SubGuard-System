require("dotenv").config();

const sendEmail = require("./config/mailer");

const testEmail = async () => {
  try {
    await sendEmail({
      to: "shaziaghosi@gmail.com",
      subject: "SubGuard Email Test",
      html: `
        <h2>Welcome to SubGuard!</h2>
        <p>Your email notification system is working.</p>
        <p>This is your first test email.</p>
      `,
    });

    console.log("Test completed successfully!");
  } catch (error) {
    console.error("Test failed:", error.message);
  }
};

testEmail();