import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Define types for the email module
interface MailOptions {
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  [key: string]: any;
}

interface Product {
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
}

interface Address {
  province: string;
  district: string;
  municipality: string;
}

// Create a reusable transporter object
const transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE || "gmail",
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL,
    pass: process.env.SMTP_PASSWORD || process.env.PASSWORD,
  },
});

// Generic email sending function
export const sendEmail = async (mailOptions: MailOptions): Promise<boolean> => {
  try {
    console.log("📧 Preparing to send email...");
    console.log("➡️ To:", mailOptions.to);
    console.log("📝 Subject:", mailOptions.subject);

    await transporter.sendMail({
      from:
        mailOptions.from ||
        `"E-Commerce" <${process.env.SMTP_USER || process.env.EMAIL}>`,
      ...mailOptions,
    });

    console.log("✅ Email sent successfully");
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return false;
  }
};

// Activation email function
export const sendActivationEmail = async (
  email: string,
  name: string,
  otp: string
): Promise<boolean> => {
  const subject = "Verify your Email";
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05); padding: 20px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4CAF50; margin-bottom: 10px;">Email Verification</h1>
        <p style="color: #555;">Please use the following OTP to verify your email address</p>
      </div>
      
      <div style="background: #f5f5f5; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
        <h2 style="margin: 0; color: #333; letter-spacing: 3px;">${otp}</h2>
      </div>
      
      <p style="color: #777; text-align: center;">This OTP will expire in 10 minutes. Do not share it with anyone.</p>
      
      <div style="margin-top: 30px; text-align: center; color: #999; font-size: 14px;">
        <p>If you didn't request this, please ignore this email.</p>
        <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
  });
};

// Sales receipt invoice function
export const sendSalesReceiptInvoiceMail = async (
  customerEmail: string,
  customerName: string,
  recipientEmail: string,
  recipientName: string,
  salesReceiptNumber: string,
  paymentDate: Date | string,
  paymentMethod: string,
  products: Product[],
  totalAmount: number,
  tax: number,
  grandTotal: number,
  branchName: string,
  branchPhoneNumber: string,
  branchAddress: Address[]
): Promise<boolean> => {
  const formattedProducts = products
    .map(
      (product) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${
          product.productName
        }</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${
          product.quantity
        }</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">RS ${product.unitPrice.toFixed(
          2
        )}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">RS ${product.discount.toFixed(
          2
        )}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">RS ${product.totalPrice.toFixed(
          2
        )}</td>
      </tr>
    `
    )
    .join("");

  const formattedAddress = `${branchAddress[0].province} province, ${branchAddress[0].district} district, ${branchAddress[0].municipality} municipality`;

  const subject = `Sales Receipt Invoice - ${salesReceiptNumber}`;
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
      <!-- Header -->
      <div style="background: #4CAF50; padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">SALES RECEIPT INVOICE</h1>
        <p style="margin: 5px 0 0; font-size: 16px; opacity: 0.9;">Ref No: ${salesReceiptNumber}</p>
      </div>

      <!-- Branch Details -->
      <div style="padding: 20px; border-bottom: 1px solid #eeeeee;">
        <h2 style="color: #4CAF50; font-size: 18px; margin-top: 0;">BRANCH DETAILS</h2>
        <p style="margin: 5px 0;"><strong>${branchName}</strong></p>
        <p style="margin: 5px 0;">${formattedAddress}</p>
        <p style="margin: 5px 0;">Tel: ${branchPhoneNumber}</p>
      </div>

      <!-- Invoice Details -->
      <div style="padding: 20px; border-bottom: 1px solid #eeeeee;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <div>
            <h2 style="color: #4CAF50; font-size: 18px; margin-top: 0;">INVOICE DETAILS</h2>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(
              paymentDate
            ).toLocaleString()}</p>
            <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${paymentMethod}</p>
          </div>
          <div style="text-align: right;">
            <h2 style="color: #4CAF50; font-size: 18px; margin-top: 0;">CUSTOMER DETAILS</h2>
            <p style="margin: 5px 0;"><strong>${customerName}</strong></p>
            <p style="margin: 5px 0;">${customerEmail}</p>
            <p style="margin: 5px 0;"><strong>Recipient:</strong> ${recipientName}</p>
          </div>
        </div>
      </div>

      <!-- Product Table -->
      <div style="padding: 20px;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e0e0e0;">Item</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e0e0e0;">Qty</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e0e0e0;">Unit Price</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e0e0e0;">Discount</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e0e0e0;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${formattedProducts}
          </tbody>
        </table>

        <!-- Totals -->
        <div style="text-align: right; margin-top: 20px;">
          <p style="margin: 5px 0;"><strong>Subtotal:</strong> RS ${totalAmount.toFixed(
            2
          )}</p>
          <p style="margin: 5px 0;"><strong>Tax (${tax}%):</strong> RS ${(
    (totalAmount * tax) /
    100
  ).toFixed(2)}</p>
          <p style="margin: 10px 0; font-size: 18px; color: #4CAF50;"><strong>Grand Total:</strong> RS ${grandTotal.toFixed(
            2
          )}</p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
        <p style="margin: 0; color: #777777;">Thank you for your business!</p>
        <p style="margin: 5px 0 0; font-weight: bold; color: #4CAF50;">${branchName} Team</p>
      </div>
    </div>
  `;

  return sendEmail({
    from: `"${branchName}" <${process.env.SMTP_USER || process.env.EMAIL}>`,
    to: [customerEmail, recipientEmail].join(", "),
    subject,
    html,
  });
};

// Export all functions
const emailService = {
  sendEmail,
  sendActivationEmail,
  sendSalesReceiptInvoiceMail,
};

export default emailService;
