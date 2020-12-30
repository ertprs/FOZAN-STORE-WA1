const sheetData = "1LkUssW4blpPLFCBAMHuspoqMj2yMNI6qHrryrvM4TH8";
const sheetDataName = "All Transaksi";

function onChange(e) {
  sheetName = e.source.getSheetName();
  form = sheetName.includes("_Not");

  if (e.changeType == "EDIT" && !form) {
    const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
    const range = sheet.getRange("A:A").getValues();

    const rows = getLastRowSpecial(range);
    const columns = sheet.getLastColumn();

    values = sheet.getRange(rows, 1, 1, 15).getDisplayValues();
    let metode;
    let pesan;
    let barcode;
    let status;
    data = values.map(val => {
      text = textPesan();
      let via = getCodeBayar(val[6].split(". ")[1]);
      try {
        barcode = via.barcode;
      } catch (e) {
        barcode = "";
      }

      //pembayaran alfa indo
      if (!via) {
        let nomor = "62" + val[9];
        pesan = text.alfa
          .replace("{transaksi}", val[1])
          .replace("{game}", sheetName)
          .replace("{data1}", val[2])
          .replace("{data2}", val[3])
          .replace("{pembelian}", val[4])
          .replace("{harga}", val[5])
          .replace("{outlet}", val[6].split(". ")[1])
          .replace("{indo/alfa}", val[6].split(". ")[1]);
        let textpesan;
        textpesan = pesan;
        const lock = LockService.getScriptLock();
        try {
          outlet = val[6].split(". ")[1];
          nominal = val[5];

          lock.waitLock(153000);

          let nomorVA = topup(outlet.toLowerCase(), nominal);

          val[11] = nomorVA.response;
          val[12] = "Abay";
          pesan = textpesan
            .replace("{nomor}", nomorVA.response)
            .replace("{nama}", "abay");
          console.log(55);
          console.log(pesan);
        } catch (e) {
          console.log(e);
          val[11] = "masukan kode";
          val[12] = "masukan atas nama";
        }
        lock.releaseLock();
        if (lock.hasLock()) {
          throw new Error("Lock violation");
        } else {
          return;
        }
        status = whatssheet(nomor.toString(), pesan, barcode);
      }
      //pembayaran bank
      if (via && !barcode) {
        pesan = text.bank
          .replace("{transaksi}", val[1])
          .replace("{game}", sheetName)
          .replace("{data1}", val[2])
          .replace("{data2}", val[3])
          .replace("{pembelian}", val[4])
          .replace("{harga}", val[5])
          .replace("{unik}", val[7])
          .replace("{total}", val[8])
          .replace("{bank}", via.metode)
          .replace("{nomor}", via.nomor)
          .replace("{nama}", via.nama);
        nomor = "62" + val[9];
        val[11] = "";
        val[12] = "";

        status = whatssheet(nomor.toString(), pesan, barcode);
        if (status === "") {
          status = whatssheet(nomor.toString(), pesan, barcode);
        }
      }
      //pembayaran non bank non alfa indo
      if (via && barcode) {
        pesan = text.ewalet

          .replace("{transaksi}", val[1])
          .replace("{game}", sheetName)
          .replace("{data1}", val[2])
          .replace("{data2}", val[3])
          .replace("{pembelian}", val[4])
          .replace("{harga}", val[5])
          .replace("{unik}", val[7])
          .replace("{total}", val[8]);
        nomor = "62" + val[9];
        val[11] = "";
        val[12] = "";

        status = whatssheet(nomor.toString(), pesan, barcode);
        if (status === "") {
          status = whatssheet(nomor.toString(), pesan, barcode);
        }
      }

      val[9] = "62" + val[9];
      val[10] = sheetName;
      val[13] = pesan;
      val[14] = status;
      return val;
    });
    wsAll = SpreadsheetApp.openById(sheetData).getSheetByName(sheetDataName);
    lastcoll = wsAll.getRange("A:A").getValues();
    lastRows = getLastRowSpecial(lastcoll);
    wsAll.appendRow(data[0]);
  }
}
