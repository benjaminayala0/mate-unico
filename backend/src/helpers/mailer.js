import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Configuración de rutas para encontrar la imagen
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const enviarCorreoCompra = async (emailUsuario, ordenId, items, total) => {
  try {
    // Construimos las filas de la tabla
    const filasTabla = items
      .map((item) => {
        const precioTotalItem = Number(item.precio_unitario) + Number(item.costo_grabado);

        return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; width: 70px; text-align: center;">
            <img 
              src="cid:logo_default" 
              alt="Mate Único" 
              style="width: 50px; height: 50px; object-fit: contain;" 
            />
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; vertical-align: middle;">
             <p style="margin: 0; font-weight: bold; font-size: 14px; color: #333;">${item.nombre}</p>
             <p style="margin: 5px 0 0; font-size: 12px; color: #777;">Cantidad: ${item.cantidad}</p>
             ${item.grabado_texto ? `<p style="margin: 2px 0 0; font-size: 11px; color: #8B5E3C;">✏️ Grabado: "${item.grabado_texto}"</p>` : ''}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; vertical-align: middle; font-weight: bold; color: #333;">
            $${precioTotalItem.toLocaleString("es-AR")}
          </td>
        </tr>
      `;
      })
      .join("");

    const mailOptions = {
      from: `"Mate Único" <${process.env.EMAIL_USER}>`,
      to: emailUsuario,
      subject: `¡Compra Exitosa! Orden #${ordenId} 🧉`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
          
          <div style="background-color: #774d2a; padding: 30px 20px; text-align: center;">
             <h1 style="color: #ffffff; margin: 0; font-size: 24px;">¡Gracias por tu compra!</h1>
             <p style="color: #e2d2c6; margin: 10px 0 0; font-size: 16px;">Tu pedido ha sido confirmado</p>
          </div>

          <div style="padding: 30px 20px;">
            <p style="color: #555; font-size: 15px; line-height: 1.5; margin-bottom: 20px;">
              Hola, tu pago para la orden <strong style="color: #774d2a;">#${ordenId}</strong> fue aprobado correctamente. 
              Estamos preparando tus mates con el cuidado que se merecen.
            </p>

            <h3 style="border-bottom: 2px solid #774d2a; padding-bottom: 10px; color: #333; margin-top: 30px;">Detalle del pedido</h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <tbody>
                ${filasTabla}
              </tbody>
            </table>

            <div style="margin-top: 20px; text-align: right;">
               <p style="font-size: 14px; color: #777; margin: 0;">Total pagado</p>
               <p style="font-size: 24px; font-weight: bold; color: #774d2a; margin: 5px 0;">$${Number(total).toLocaleString("es-AR")}</p>
            </div>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
              <p>Si tienes alguna duda, responde a este correo o contáctanos por Instagram @MateUnico</p>
              <p>© 2025 Mate Único. Todos los derechos reservados.</p>
            </div>
          </div>
        </div>
      `,
      // Aca adjuntamos la imagen físicamente al correo
      attachments: [
        {
          filename: 'logo-mate-unico.png',
          path: path.join(__dirname, '../assets/logo-mate-unico.png'), 
          cid: 'logo_default' 
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Correo enviado: " + info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Error enviando correo:", error);
    return false;
  }
};