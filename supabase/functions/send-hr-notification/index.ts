import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationRequest {
  type: "leave_request" | "overtime_request";
  employeeName: string;
  details: {
    startDate?: string;
    endDate?: string;
    leaveType?: string;
    dayType?: string;
    reason?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    hours?: number;
  };
}

const leaveTypeLabels: Record<string, string> = {
  vacation: "Congés payés",
  rtt: "RTT",
  paternity: "Congé paternité",
  maternity: "Congé maternité",
  sickChild: "Congé enfant malade",
  sickLeave: "Arrêt maladie",
  unpaidUnexcused: "Absence injustifiée non rémunérée",
  unpaidExcused: "Absence justifiée non rémunérée",
  unpaid: "Absence non rémunérée",
  annual: "Congé annuel",
  familyEvent: "Absences pour événements familiaux"
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const hrNotificationEmail = Deno.env.get("HR_NOTIFICATION_EMAIL");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured");
      throw new Error("RESEND_API_KEY is not configured");
    }

    if (!hrNotificationEmail) {
      console.error("HR_NOTIFICATION_EMAIL is not configured");
      throw new Error("HR_NOTIFICATION_EMAIL is not configured");
    }

    const resend = new Resend(resendApiKey);
    const { type, employeeName, details }: NotificationRequest = await req.json();

    console.log("Received notification request:", { type, employeeName, details });

    let subject: string;
    let htmlContent: string;

    if (type === "leave_request") {
      const leaveTypeFr = leaveTypeLabels[details.leaveType || ""] || details.leaveType;
      const dayTypeFr = details.dayType === "half" ? "Demi-journée" : "Journée complète";
      
      subject = `📅 Nouvelle demande de congé - ${employeeName}`;
      htmlContent = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Nouvelle demande de congé</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e9ecef; border-top: none;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              <strong>${employeeName}</strong> a soumis une nouvelle demande de congé.
            </p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 12px 0; font-weight: 600; color: #6c757d;">Type de congé</td>
                <td style="padding: 12px 0;">${leaveTypeFr}</td>
              </tr>
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 12px 0; font-weight: 600; color: #6c757d;">Date de début</td>
                <td style="padding: 12px 0;">${formatDate(details.startDate || "")}</td>
              </tr>
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 12px 0; font-weight: 600; color: #6c757d;">Date de fin</td>
                <td style="padding: 12px 0;">${formatDate(details.endDate || "")}</td>
              </tr>
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 12px 0; font-weight: 600; color: #6c757d;">Type de journée</td>
                <td style="padding: 12px 0;">${dayTypeFr}</td>
              </tr>
              ${details.reason ? `
              <tr>
                <td style="padding: 12px 0; font-weight: 600; color: #6c757d;">Motif</td>
                <td style="padding: 12px 0;">${details.reason}</td>
              </tr>
              ` : ""}
            </table>
            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin-top: 20px;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                ⏳ Cette demande est en attente de validation. Connectez-vous au portail RH pour l'approuver ou la refuser.
              </p>
            </div>
          </div>
          <p style="text-align: center; color: #6c757d; font-size: 12px; margin-top: 20px;">
            Email envoyé automatiquement par BeeOnTime
          </p>
        </body>
        </html>
      `;
    } else if (type === "overtime_request") {
      subject = `⏰ Nouvelle demande d'heures supplémentaires - ${employeeName}`;
      htmlContent = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Nouvelle demande d'heures supplémentaires</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e9ecef; border-top: none;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              <strong>${employeeName}</strong> a soumis une demande d'heures supplémentaires.
            </p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 12px 0; font-weight: 600; color: #6c757d;">Date</td>
                <td style="padding: 12px 0;">${formatDate(details.date || "")}</td>
              </tr>
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 12px 0; font-weight: 600; color: #6c757d;">Horaires</td>
                <td style="padding: 12px 0;">De ${details.startTime} à ${details.endTime}</td>
              </tr>
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 12px 0; font-weight: 600; color: #6c757d;">Nombre d'heures</td>
                <td style="padding: 12px 0;"><strong>${details.hours} heures</strong></td>
              </tr>
              ${details.reason ? `
              <tr>
                <td style="padding: 12px 0; font-weight: 600; color: #6c757d;">Motif</td>
                <td style="padding: 12px 0;">${details.reason}</td>
              </tr>
              ` : ""}
            </table>
            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin-top: 20px;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                ⏳ Cette demande est en attente de validation. Connectez-vous au portail RH pour l'approuver ou la refuser.
              </p>
            </div>
          </div>
          <p style="text-align: center; color: #6c757d; font-size: 12px; margin-top: 20px;">
            Email envoyé automatiquement par BeeOnTime
          </p>
        </body>
        </html>
      `;
    } else {
      throw new Error(`Unknown notification type: ${type}`);
    }

    console.log("Sending email to:", hrNotificationEmail);

    const emailResponse = await resend.emails.send({
      from: "BeeOnTime <onboarding@resend.dev>",
      to: [hrNotificationEmail],
      subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending notification email:", errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
