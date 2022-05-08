import { google } from "googleapis";
import keys from "../../secrets";

export default function handler(req, res) {
  //#region Auth
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
      //#endregion

      // sheet specific info
      const request = {
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: "GoogleSheetsDatabase!A1:C",
      };

      let data = await gsapi.spreadsheets.values.get(request, client.auth);
      // console.log(data.data.values[1][0]);

      let headers = {
        headerText: [],
        headerRow: [],
        entries: {
          headerIndex: [],
          entryText: [],
        },
      };

      // Get values for Headers
      for (let i = 0; i < data.data.values.length; i++) {
        if (data.data.values[i][0]) {
          headers.headerText.push(data.data.values[i][0]);
          headers.headerRow.push(i);
        }
        // console.log(data.data.values[i][0]);
      }
      console.log(headers.headerRow);

      //For each header, assign entries
      for (let h = 0; h < headers.headerRow.length; h++) {
        console.log("HeaderRow " + headers.headerRow[h]);

        // Special case for Last header
        if (h == headers.headerRow.length - 1) {
          for (
            let r = headers.headerRow[h] + 1; // Starts on row after header
            r < data.data.values.length; // ends row before next header
            r++
          ) {
            if (!data.data.values[r][1]) {
              break;
            }
            headers.entries.headerIndex.push(h);
            console.log(
              "row " +
                r +
                " - HeaderIndex " +
                headers.entries.headerIndex[
                  headers.entries.headerIndex.length - 1
                ]
            );

            headers.entries.entryText.push(
              data.data.values[r][1],
              data.data.values[r][2],
              data.data.values[r][3]
            );
          }
        }

        //Range for entries in database
        for (
          let r = headers.headerRow[h] + 1; // Starts on row after header
          r < headers.headerRow[h + 1]; // ends row before next header
          r++
        ) {
          headers.entries.headerIndex.push(h);
          console.log(
            "row " +
              r +
              " - HeaderIndex " +
              headers.entries.headerIndex[
                headers.entries.headerIndex.length - 1
              ]
          );

          headers.entries.entryText.push(
            data.data.values[r][1],
            data.data.values[r][2],
            data.data.values[r][3]
          );
        }
      }
      console.log(headers.entries);

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
