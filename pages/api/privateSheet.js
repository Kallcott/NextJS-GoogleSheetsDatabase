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

      //#region Request Names of Multiple Worksheets
      const requestSpreadSheetInfo = {
        spreadsheetId: process.env.SPREADSHEET_ID,
      };

      let dataSpreadSheetInfo = await gsapi.spreadsheets.get(
        requestSpreadSheetInfo,
        client.auth
      );

      let sheetNames = [];
      dataSpreadSheetInfo.data.sheets.forEach((i) => {
        sheetNames.push(i.properties.title);
      });

      // console.log(dataSpreadSheetInfo.data.sheets);
      console.log(sheetNames);

      // function ToRange(strArray) {
      //   let range = "";
      //   strArray.forEach((str) => {
      //     range += `${str}!A1:E&ranges=`;
      //   });
      //   range = "ranges=" + range;
      //   range = range.slice(0, -8);
      //   return range;
      // }
      function ToRange(strArray) {
        let newArr = strArray.map((element, index) => {
          return element + "!A1:E";
        });
        return newArr;
      }
      console.log(ToRange(sheetNames));

      //#endregion

      // sheet specific info
      const request = {
        spreadsheetId: process.env.SPREADSHEET_ID,
        ranges: ToRange(sheetNames),
      };

      let data = await gsapi.spreadsheets.values.batchGet(request, client.auth);
      console.log(data.data);

      class entry {
        constructor(instruction, details, headerIndex) {
          this.entryInstruction = instruction;
          this.entryDetails = details;
          this.headerIndex = headerIndex;
        }
      }
      class header {
        constructor(text, row) {
          this.headerText = text;
          this.headerRow = row;
          this.headerEntries = [];
        }
      }
      class sheet {
        constructor() {
          this.headers = [];
        }
        newHeader(text, row) {
          let h = new header(text, row);
          console.log(
            " - " + h.headerText + " - " + h.headerRow + " - " + h.headerEntries
          );
          this.headers.push(h);
        }
        newEntry(instruction, details, headerIndex) {
          let e = new entry(instruction, details, headerIndex);
          this.headers[e.headerIndex].headerEntries.push(e);
          console.log("- Instruction: " + e.entryInstruction);
        }
      }

      // ----------------
      // Get values for Headers
      console.log("------ Creating Sheet ------");
      let sheet1 = new sheet();

      console.log("------ Creating Headers ------");
      for (let i = 0; i < data.data.values.length; i++) {
        if (data.data.values[i][0]) {
          sheet1.newHeader(data.data.values[i][0], i);
        }
      }

      //For each header, assign entries
      console.log("------ Creating Entries ------");
      for (let hIndex = 0; hIndex < sheet1.headers.length; hIndex++) {
        console.log("--- For Header: " + sheet1.headers[hIndex].headerText);

        // Special case for Last header
        if (hIndex == sheet1.headers.length - 1) {
          console.log("------- Inside Last Header Special Case -------");
          for (
            let row = sheet1.headers[hIndex].headerRow + 1; // Starts on row after header
            row < data.data.values.length; // stops before the last row
            row++
          ) {
            // Break if there is null value in row
            if (!data.data.values[row][1]) {
              break;
            }
            sheet1.newEntry(
              data.data.values[row][1],
              data.data.values[row][2],
              hIndex
            );
          }
          // Break after the last header.
          break;
        }

        //Range for entries in database
        for (
          let row = sheet1.headers[hIndex].headerRow + 1; // Starts on row after header
          row < sheet1.headers[hIndex + 1].headerRow; // ends row before next header
          row++
        ) {
          sheet1.newEntry(
            data.data.values[row][1],
            data.data.values[row][2],
            hIndex
          );
        }
      }
      console.log("------ Creating Json -------");
      console.log("Json String: " + JSON.stringify(sheet1));

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
