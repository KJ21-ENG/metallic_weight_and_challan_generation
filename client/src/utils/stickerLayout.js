/**
 * Sticker layout template for 75mm x 125mm labels
 * Used by the printer utility for generating printable sticker HTML
 */
/**
 * Generate HTML for the sticker label
 */
export function generateStickerHTML(data) {
    const { header, dateText, color, cut, bobQty, gross, bobWeight, boxWeight, net, operator, helper, barcode, tare, boxType, firmName } = data;
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${firmName}</title>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    <style>
        @page {
            size: 75mm 125mm;
            margin: 0;
        }

        body {
            margin: 0;
            padding: 0;
        }

        .sticker-border {
            width: 75mm;
            height: 125mm;
            box-sizing: border-box;
            padding: 10px;
            border: 2px solid black;
            border-radius: 10px;
            background-color: white;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .sticker-inner {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            border: 2px solid black;
            border-radius: 10px;
            overflow: hidden;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            flex-grow: 1;
        }

        td {
            border: 1px solid black;
            padding: 6px;
            font-size: 11px;
            font-weight: bold;
            color: black;
        }

        .header {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            font-style: italic;
            font-family: 'Arial Black', sans-serif;
            padding: 8px;
            border-bottom: 2px solid black;
            color: black;
        }

        .barcode-container {
            text-align: center;
            padding: 8px;
            border-top: 2px solid black;
        }

        #barcode {
            max-width: 90%;
            height: auto;
        }
    </style>
</head>
<body>
    <div class="sticker-border">
        <div class="sticker-inner">
            <div class="header">${firmName}</div>
            <table>
                <tr>
                    <td>DATE :</td>
                    <td>${dateText}</td>
                </tr>
                <tr>
                    <td>COLOR :</td>
                    <td>${color}</td>
                </tr>
                <tr>
                    <td>CUT :</td>
                    <td>${cut}</td>
                </tr>
                <tr>
                    <td>BOB QTY :</td>
                    <td>${bobQty}</td>
                </tr>
                <tr>
                    <td>GR. WT :</td>
                    <td>${gross.toFixed(3)} kg</td>
                </tr>
                <tr>
                    <td>Box Wt :</td>
                    <td>${boxWeight.toFixed(3)} kg</td>
                </tr>
                <tr>
                    <td>Bob Wt :</td>
                    <td>${(bobWeight * bobQty).toFixed(3)} kg</td>
                </tr>
                <tr>
                    <td>NET WT :</td>
                    <td>${net.toFixed(3)} kg</td>
                </tr>
                <tr>
                    <td>OP & HE :</td>
                    <td>${operator}${helper ? ' & ' + helper : ''}</td>
                </tr>
            </table>
            <div class="barcode-container">
                <svg id="barcode"></svg>
            </div>
        </div>
    </div>

    <script>
        window.onload = function () {
            try {
                JsBarcode("#barcode", "${barcode}", {
                    format: "CODE128",
                    displayValue: true,
                    fontSize: 12,
                    height: 40,
                    width: 1.5,
                    lineColor: "#000",
                    margin: 5
                });
                console.log("Barcode generated successfully");
            } catch (e) {
                console.error("Error generating barcode:", e);
            }
        }
    </script>
</body>
</html>
  `;
}
// Note: DEFAULT_STICKER_HEADER is no longer used since we now use firmName dynamically
