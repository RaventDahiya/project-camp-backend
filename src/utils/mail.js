import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendMail = async (Options) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Task Manager",
      link: "https://mailgen.js/",
    },
  });
  var emailText = mailGenerator.generatePlaintext(Options.mailGenContent);
  var emailHtml = mailGenerator.generate(Options.mailGenContent);

  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMTP_HOST,
    port: process.env.MAILTRAP_SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.MAILTRAP_SMTP_USER,
      pass: process.env.MAILTRAP_SMTP_PASS,
    },
  });

  const mail = {
    from: process.env.SENDER_ADDRESS,
    to: Options.email,
    subject: Options.subject,
    text: emailText, // plain‑text body
    html: emailHtml, // HTML body
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.error("email fail", error);
  }
};

const emailVerificationMailGenContent = (username, verificationUrl) => {
  return {
    body: {
      name: username,
      intro: "Welcome to App! We're very excited to have you on board.",
      action: {
        instructions: "To get started with App, please click here:",
        button: {
          color: "#22BC66",
          text: "Verify your email",
          link: verificationUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

const forgotPasswordMailGenContent = (username, passwordResetUrl) => {
  return {
    body: {
      name: username,
      intro: "we got a request to reset your password.",
      action: {
        instructions: "To change your password, please click here:",
        button: {
          color: "#22BC66", // Optional action button color
          text: "Reset Password",
          link: passwordResetUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

// sendMail({
//   email: user.email,
//   subject: "aaa",
//   mailGenContent: emailVerificationMailGenContent(username, ``),
// });

export {
  sendMail,
  forgotPasswordMailGenContent,
  emailVerificationMailGenContent,
};
