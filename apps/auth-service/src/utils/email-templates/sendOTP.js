import nodemailer from "nodemailer";

export const sendSalesReceiptInvoiceMail = async (
  customerEmail,
  customerName,
  recipientEmail,
  recipientName,
  salesReceiptNumber,
  paymentDate,
  paymentMethod,
  products,
  totalAmount,
  tax,
  grandTotal,
  branchName,
  branchPhoneNumber,
  branchAddress
) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const formattedProducts = products
      .map(
        (product) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${product.productName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${product.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">RS ${product.unitPrice.toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">RS ${product.discount.toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">RS ${product.totalPrice.toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

    const formattedAddress = `${branchAddress[0].province} province, ${branchAddress[0].district} district, ${branchAddress[0].municipality} municipality`;

    // Email content setup
    const mailOptions = {
      from: `"${branchName}" <${process.env.EMAIL}>`,
      to: [customerEmail, recipientEmail],
      subject: `Sales Receipt Invoice - ${salesReceiptNumber}`,
      html: `
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
                <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(paymentDate).toLocaleString()}</p>
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
              <p style="margin: 5px 0;"><strong>Subtotal:</strong> RS ${totalAmount.toFixed(2)}</p>
              <p style="margin: 5px 0;"><strong>Tax (${tax}%):</strong> RS ${((totalAmount * tax) / 100).toFixed(2)}</p>
              <p style="margin: 10px 0; font-size: 18px; color: #4CAF50;"><strong>Grand Total:</strong> RS ${grandTotal.toFixed(2)}</p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
            <p style="margin: 0; color: #777777;">Thank you for your business!</p>
            <p style="margin: 5px 0 0; font-weight: bold; color: #4CAF50;">${branchName} Team</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${customerEmail} and ${recipientEmail}`);
  } catch (error) {
    console.error(`Error sending email: ${error.message}`);
    throw error;
  }
};