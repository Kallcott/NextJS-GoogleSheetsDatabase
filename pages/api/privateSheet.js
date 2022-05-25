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

      // Requests usinsg spreadsheet.get
      const requestSpreadSheetInfo = {
        spreadsheetId: process.env.SPREADSHEET_ID,
      };

      let dataSpreadSheetInfo = await gsapi.spreadsheets.get(
        requestSpreadSheetInfo,
        client.auth
      );

      // Pulling Sheetnames into a range to use in the following sheet request.
      let sheetNames = [];
      dataSpreadSheetInfo.data.sheets.forEach((i) => {
        sheetNames.push(i.properties.title);
      });

      function ToRange(strArray) {
        let newArr = strArray.map((element, index) => {
          return element + "!A1:E";
        });
        return newArr;
      }
      console.log(ToRange(sheetNames));

      //#endregion

      //#region Sheet specific info
      const request = {
        spreadsheetId: process.env.SPREADSHEET_ID,
        ranges: ToRange(sheetNames),
      };

      let data = await gsapi.spreadsheets.values.batchGet(request, client.auth);

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
        constructor(text) {
          this.title = text;
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

      console.log("------ Creating SheetList ------");
      let sheetlist = [];
      for (let s = 0; s < data.data.valueRanges.length; s++) {
        console.log(`------ Creating Sheet ${s + 1} ------`);
        let currSheet = new sheet(sheetNames[s]);

        console.log("------ Creating Headers ------");
        for (let row = 0; row < data.data.valueRanges[s].values.length; row++) {
          if (data.data.valueRanges[s].values[row][0]) {
            currSheet.newHeader(data.data.valueRanges[s].values[row][0], row);
          }
        }

        //For each header, assign entries
        console.log("------ Creating Entries ------");
        for (let h = 0; h < currSheet.headers.length; h++) {
          console.log("--- For Header: " + currSheet.headers[h].headerText);

          // Special case for Last header
          if (h == currSheet.headers.length - 1) {
            console.log("------- Inside Last Header Special Case -------");
            for (
              let row = currSheet.headers[h].headerRow + 1; // Starts on row after header
              row < data.data.valueRanges[s].values.length; // stops before the last row
              row++
            ) {
              // Break if there is null value in row
              if (!data.data.valueRanges[s].values[row][1]) {
                break;
              }
              currSheet.newEntry(
                data.data.valueRanges[s].values[row][1],
                data.data.valueRanges[s].values[row][2],
                h
              );
            }
            // Break after the last header.
            break;
          }

          //Range for entries in database
          for (
            let row = currSheet.headers[h].headerRow + 1; // Starts on row after header
            row < currSheet.headers[h + 1].headerRow; // ends row before next header
            row++
          ) {
            currSheet.newEntry(
              data.data.valueRanges[s].values[row][1],
              data.data.valueRanges[s].values[row][2],
              h
            );
          }
        }
        sheetlist.push(currSheet);
      }
      //#endregion

      console.log("------ Creating Json -------");
      // console.log("Json String: " + JSON.stringify(sheetlist));

      return res
        .status(400)
        .send(JSON.stringify({ error: false, data: sheetlist }));
    });
  } catch (e) {
    return res
      .status(400)
      .send(JSON.stringify({ error: true, message: e.message }));
  }
}
