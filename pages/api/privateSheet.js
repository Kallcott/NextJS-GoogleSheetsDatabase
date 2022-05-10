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
        range: "GoogleSheetsDatabase!A1:E",
      };

      let data = await gsapi.spreadsheets.values.get(request, client.auth);
      // console.log(data.data.values[1][0]);

      class entry {
        constructor(instruction, step, headerIndex) {
          this.entryInstruction = instruction;
          this.entryStep = step;
          this.headerIndex = headerIndex;
        }
      }
      class entries {
        constructor() {
          this.entries = [];
        }
      }
      class header {
        constructor(text, row) {
          this.headerText = text;
          this.headerRow = row;
          this.headerEntries = [];
        }
      }
      class headers {
        constructor() {
          this.headers = [];
        }
      }
      class sheet {
        constructor() {
          this.headers = [];
        }
        newHeader(text, row) {
          let h = new header(text, row);
          this.headers.push(h);
        }
        newEntry(instruction, step, headerIndex) {
          let e = new entry(instruction, step, headerIndex);
          this.headers[e.headerIndex].headerEntries.push(e);
        }
      }

      // ----------------
      // Get values for Headers
      console.log("Creating sheet");
      let sheet1 = new sheet();
      for (let i = 0; i < data.data.values.length; i++) {
        if (data.data.values[i][0]) {
          sheet1.newHeader(data.data.values[i][0], i);
        }
      }

      //For each header, assign entries
      for (let i = 0; i < sheet1.headers.length; i++) {
        console.log("HeaderRow " + sheet1.headers[i].headerRow);

        // Special case for Last header
        if (i == sheet1.headers.length - 1) {
          for (
            let row = sheet1.headers[i].headerRow + 1; // Starts on row after header
            row < data.data.values.length; // stops before the last row
            row++
          ) {
            if (!data.data.values[row][1]) {
              break;
            }
            sheet1.newEntry(
              data.data.values[row][1],
              data.data.values[row][2],
              i
            );
            console.log(
              "row " + row + " - HeaderIndex " + sheet1.headers[i].entries
            );
          }
        }
        if (!data.data.values[i][1]) {
          break;
        }
        //Range for entries in database
        for (
          let row = sheet1.headers[i].headerRow + 1; // Starts on row after header
          row < sheet1.headers[i + 1].headerRow; // ends row before next header
          row++
        ) {
          sheet1.newEntry(
            data.data.values[row][1],
            data.data.values[row][2],
            i
          );
          console.log(
            "row " + row + " - HeaderIndex " + sheet1.headers[i].entries
          );
        }
      }
      console.log(JSON.stringify(sheet1));

      return res
        .status(400)
        .send(JSON.stringify({ error: false, data: sheet1 }));
    });
  } catch (e) {
    return res
      .status(400)
      .send(JSON.stringify({ error: true, message: e.message }));
  }
}
