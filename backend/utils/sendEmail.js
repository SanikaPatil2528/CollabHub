import nodemailer from "nodemailer";

export const sendEmail = async({toEmail,subject,htmlContent})=>{
    try {
        // configure the SMTP transporter channel
        const transporter=nodemailer.createTransport({
            host:process.env.SMTP_HOST,
            port:parseInt(process.env.SMTP_PORT || "2525",10),
            auth:{
                user:process.env.SMTP_USER,
                pass:process.env.SMTP_PASS,
            },
        });

        // structural parameters of the message envelope
        const mailOptions={
            from:`"CollabHub" <${process.env.SMTP_FROM_EMAIL}>`,
            to: toEmail,
            subject:subject,
            html:htmlContent,
        }

        // dispatch the message
        const info = await transporter.sendMail(mailOptions);
        console.log(`Outbound email cleanly dispatched. Message ID: ${info.messageId}`);
        return info;
        
    } catch (error) {
        // we log the error internally so the server operators can inspect it, but we avoid crashing the primary client response pipeline
        console.error("Failed to dispatch system email: ",error.message);
    }
};