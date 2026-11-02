import * as XLSX from "xlsx";
import { reportLogo } from "./reportLogo";

/** Embed the logo in the summary sheet using standard Open XML drawing parts. */
export function brandedWorkbookBytes(workbook: XLSX.WorkBook): Uint8Array {
  const zip = XLSX.CFB.read(
    new Uint8Array(XLSX.write(workbook, { type: "array", bookType: "xlsx" })),
    { type: "array" },
  );
  const read = (path: string) =>
    new TextDecoder().decode(
      XLSX.CFB.find(zip, "/" + path)!.content as Uint8Array,
    );
  const add = (path: string, content: string | Uint8Array) =>
    XLSX.CFB.utils.cfb_add(
      zip,
      "/" + path,
      typeof content === "string" ? new TextEncoder().encode(content) : content,
    );
  const index = workbook.SheetNames.indexOf("Report Summary") + 1;
  const sheet = `xl/worksheets/sheet${index}.xml`;
  add(
    sheet,
    read(sheet).replace(
      "</worksheet>",
      '<drawing xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rIdLogo"/></worksheet>',
    ),
  );
  add(
    `xl/worksheets/_rels/sheet${index}.xml.rels`,
    '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/reportLogo.xml"/></Relationships>',
  );
  add(
    "xl/drawings/reportLogo.xml",
    '<?xml version="1.0" encoding="UTF-8"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><xdr:oneCellAnchor><xdr:from><xdr:col>3</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:ext cx="1905000" cy="994387"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="1" name="URUTIX logo"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rIdLogoImage"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>',
  );
  add(
    "xl/drawings/_rels/reportLogo.xml.rels",
    '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdLogoImage" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/urutix.png"/></Relationships>',
  );
  add(
    "xl/media/urutix.png",
    Uint8Array.from(atob(reportLogo.split(",")[1]), (c) => c.charCodeAt(0)),
  );
  let types = read("[Content_Types].xml");
  if (!types.includes('Extension="png"'))
    types = types.replace(
      "</Types>",
      '<Default Extension="png" ContentType="image/png"/></Types>',
    );
  add(
    "[Content_Types].xml",
    types.replace(
      "</Types>",
      '<Override PartName="/xl/drawings/reportLogo.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>',
    ),
  );
  return new Uint8Array(
    XLSX.CFB.write(zip, { type: "array", fileType: "zip" }),
  );
}

export function downloadWorkbook(workbook: XLSX.WorkBook, filename: string) {
  const bytes = brandedWorkbookBytes(workbook);
  const url = URL.createObjectURL(
    new Blob([bytes as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
