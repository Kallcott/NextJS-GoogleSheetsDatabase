import { google } from "googleapis";
import keys from "../../secrets";

export default function handler(req, res) {
  //get values from keys json file.
  try {
    const client = new google.auth.JWT(
      keys.client_email,
      null,
      keys.private_key,
      ["https://www.googleapis.com/auth/spreadsheets"]
    );

    // authorise the account to access sheets
    client.authorize(async function (err, tokens) {
      //error check
      if (err) {
        return res.status(400).send(JSON.stringify({ error: true }));
      }

      // sets us to use googlehseets API
      const gsapi = google.sheets({ version: "v4", auth: client });

      // sheet specific info
      const request = {
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: "GoogleSheetsDatabase!A1:C3",
      };

      let data = await gsapi.spreadsheets.values.get(request, client.auth);
      return res
        .status(400)
        .send(JSON.stringify({ error: false, data: data.data.values }));
    });
  } catch (e) {
    return res
      .status(400)
      .send(JSON.stringify({ error: true, message: e.message }));
  }
}
