
import 'package:barcode/barcode.dart' as bc;
import 'package:flutter/material.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

class LabelPrinter {
  static Future<bool> printLabel({
    required String header,
    required String dateText,
    required String color,
    required String cut,
    required int bobQty,
    required double gross,
    required double bobWeight,
    required double boxWeight,
    required double net,
    required String operator,
    required String helper,
    required String barcode,
    required double tare,
    required String boxType,
    required String firmName,
  }) async {
    try {
      final doc = pw.Document();

      final code128 = bc.Barcode.code128();
      final svg = code128.toSvg(barcode, width: 200, height: 40, drawText: true, textPadding: 2);

      doc.addPage(
        pw.Page(
          pageFormat: const PdfPageFormat(75 * PdfPageFormat.mm, 125 * PdfPageFormat.mm, marginAll: 0),
          build: (context) {
            return pw.Container(
              padding: const pw.EdgeInsets.all(10),
              decoration: pw.BoxDecoration(border: pw.Border.all(), borderRadius: pw.BorderRadius.circular(10)),
              child: pw.Container(
                decoration: pw.BoxDecoration(border: pw.Border.all(), borderRadius: pw.BorderRadius.circular(10)),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.stretch,
                  children: [
                    pw.Container(
                      padding: const pw.EdgeInsets.all(8),
                      decoration: const pw.BoxDecoration(border: pw.Border(bottom: pw.BorderSide())) ,
                      child: pw.Text(firmName, style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold)),
                    ),
                    pw.Table(
                      border: pw.TableBorder.all(),
                      children: [
                        _row('DATE :', dateText),
                        _row('COLOR :', color),
                        _row('CUT :', cut),
                        _row('BOB QTY :', '$bobQty'),
                        _row('GR. WT :', '${gross.toStringAsFixed(3)} kg'),
                        _row('Box Wt :', '${boxWeight.toStringAsFixed(3)} kg'),
                        _row('Bob Wt :', '${(bobWeight * bobQty).toStringAsFixed(3)} kg'),
                        _row('NET WT :', '${net.toStringAsFixed(3)} kg'),
                        _row('OP & HE :', helper.isEmpty ? operator : '$operator & $helper'),
                      ],
                    ),
                    pw.SizedBox(height: 6),
                    pw.Center(child: pw.SvgImage(svg: svg)),
                  ],
                ),
              ),
            );
          },
        ),
      );

      // Always show system print dialog for maximum compatibility on macOS/Windows
      // Saved printer name is still kept in preferences for future direct printing if needed
      await Printing.layoutPdf(onLayout: (format) async => doc.save());
      return true;
    } catch (e) {
      debugPrint('Label print error: $e');
      return false;
    }
  }

  static pw.TableRow _row(String k, String v) {
    return pw.TableRow(children: [
      pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text(k, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 11))),
      pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text(v, style: const pw.TextStyle(fontSize: 11))),
    ]);
  }
}


