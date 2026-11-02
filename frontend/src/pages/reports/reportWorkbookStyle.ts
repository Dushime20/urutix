import * as XLSX from "xlsx";

const ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
export const columnLabel = (value: string) =>
  value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

export function reportLayout(source: XLSX.WorkBook): XLSX.WorkBook {
  const result = { ...source, Sheets: { ...source.Sheets } };
  const info = XLSX.utils.sheet_to_json<(string | number)[]>(
    source.Sheets["Report Summary"],
    { header: 1 },
  );
  const period = String(info.find((r) => r[0] === "Period")?.[1] || "");
  for (const name of source.SheetNames) {
    const original = source.Sheets[name];
    const sheet: XLSX.WorkSheet = {};
    const range = XLSX.utils.decode_range(original["!ref"] || "A1");
    const widths = Array.from({ length: Math.max(2, range.e.c + 1) }, () => 20);
    for (const [address, cell] of Object.entries(original)) {
      if (address.startsWith("!")) continue;
      const pos = XLSX.utils.decode_cell(address);
      widths[pos.c] = Math.min(
        48,
        Math.max(widths[pos.c], String(cell.v ?? "").length + 3),
      );
      const header = pos.r === 0;
      pos.r += 7;
      sheet[XLSX.utils.encode_cell(pos)] = {
        ...cell,
        ...(header && typeof cell.v === "string"
          ? { v: columnLabel(cell.v) }
          : {}),
      };
    }
    const lastColumn = widths.length - 1;
    for (let r = 7; r <= range.e.r + 7; r++) {
      for (let c = 0; c <= lastColumn; c++) {
        const address = XLSX.utils.encode_cell({ r, c });
        if (!sheet[address]) sheet[address] = { t: "s", v: "" };
      }
    }
    sheet.A5 = { t: "s", v: `URUTIX | ${name}` };
    sheet.A6 = { t: "s", v: period };
    sheet["!ref"] = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: range.e.r + 7, c: lastColumn },
    });
    sheet["!merges"] = [4, 5].map((r) => ({
      s: { r, c: 0 },
      e: { r, c: lastColumn },
    }));
    sheet["!cols"] = widths.map((wch) => ({ wch }));
    sheet["!rows"] = Array.from({ length: range.e.r + 8 }, (_, r) => ({
      hpt: r < 4 ? 20 : r === 4 || r === 7 ? 30 : 26,
    }));
    for (const [address, cell] of Object.entries(sheet)) {
      if (address.startsWith("!")) continue;
      const pos = XLSX.utils.decode_cell(address);
      if (pos.r < 7) continue;
      const lines = String(cell.v ?? "")
        .split("\n")
        .reduce(
          (sum, line) =>
            sum + Math.max(1, Math.ceil(line.length / (widths[pos.c] - 3))),
          0,
        );
      sheet["!rows"]![pos.r].hpt = Math.max(
        sheet["!rows"]![pos.r].hpt!,
        lines * 15,
      );
    }
    if (name !== "Report Summary")
      sheet["!autofilter"] = {
        ref: XLSX.utils.encode_range({
          s: { r: 7, c: 0 },
          e: { r: range.e.r + 7, c: range.e.c },
        }),
      };
    result.Sheets[name] = sheet;
  }
  return result;
}

/** Preserve the writer's number formats while adding report presentation styles. */
export function styleReportSheets(
  read: (path: string) => string,
  write: (path: string, xml: string) => void,
  count: number,
) {
  const parser = new DOMParser();
  const serializer = new XMLSerializer();
  const styles = parser.parseFromString(
    read("xl/styles.xml"),
    "application/xml",
  );
  const append = (collection: string, xml: string) => {
    const parent = styles.getElementsByTagNameNS(ns, collection)[0];
    const index = parent.children.length;
    const node = parser.parseFromString(
      `<root xmlns="${ns}">${xml}</root>`,
      "application/xml",
    ).documentElement.firstElementChild!;
    parent.appendChild(styles.importNode(node, true));
    parent.setAttribute("count", String(parent.children.length));
    return index;
  };
  const white = append(
    "fonts",
    '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>',
  );
  const body = append(
    "fonts",
    '<font><sz val="11"/><color rgb="FF18364B"/><name val="Calibri"/></font>',
  );
  const title = append(
    "fonts",
    '<font><b/><sz val="18"/><color rgb="FF18364B"/><name val="Calibri"/></font>',
  );
  const dark = append(
    "fills",
    '<fill><patternFill patternType="solid"><fgColor rgb="FF18364B"/><bgColor indexed="64"/></patternFill></fill>',
  );
  const blue = append(
    "fills",
    '<fill><patternFill patternType="solid"><fgColor rgb="FFC4E7F3"/><bgColor indexed="64"/></patternFill></fill>',
  );
  const border = append(
    "borders",
    '<border><left/><right/><top/><bottom style="thin"><color rgb="FFA7D8E9"/></bottom><diagonal/></border>',
  );
  const formats = styles.getElementsByTagNameNS(ns, "cellXfs")[0];
  const cache = new Map<string, number>();
  const cellStyle = (base: number, row: number) => {
    const kind =
      row === 5
        ? "title"
        : row === 8
          ? "header"
          : row > 8 && row % 2 === 1
            ? "blue"
            : "white";
    const key = `${base}-${kind}`;
    if (cache.has(key)) return cache.get(key)!;
    const xf = formats.children[base].cloneNode(true) as Element;
    xf.setAttribute(
      "fontId",
      String(kind === "header" ? white : kind === "title" ? title : body),
    );
    xf.setAttribute(
      "fillId",
      String(kind === "header" ? dark : kind === "blue" ? blue : 0),
    );
    xf.setAttribute("borderId", String(row >= 8 ? border : 0));
    for (const name of [
      "applyFont",
      "applyFill",
      "applyBorder",
      "applyAlignment",
    ])
      xf.setAttribute(name, "1");
    for (const child of Array.from(xf.children))
      if (child.localName === "alignment") xf.removeChild(child);
    const alignment = styles.createElementNS(ns, "alignment");
    alignment.setAttribute("vertical", "center");
    alignment.setAttribute("wrapText", "1");
    xf.appendChild(alignment);
    const index = formats.children.length;
    formats.appendChild(xf);
    formats.setAttribute("count", String(formats.children.length));
    cache.set(key, index);
    return index;
  };
  for (let i = 1; i <= count; i++) {
    const path = `xl/worksheets/sheet${i}.xml`;
    const sheet = parser.parseFromString(read(path), "application/xml");
    const view = sheet.getElementsByTagNameNS(ns, "sheetView")[0];
    view.setAttribute("showGridLines", "0");
    const pane = sheet.createElementNS(ns, "pane");
    for (const [key, value] of Object.entries({
      ySplit: "8",
      topLeftCell: "A9",
      activePane: "bottomLeft",
      state: "frozen",
    }))
      pane.setAttribute(key, value);
    view.insertBefore(pane, view.firstChild);
    for (const cell of Array.from(sheet.getElementsByTagNameNS(ns, "c"))) {
      const row = Number(cell.getAttribute("r")!.match(/\d+$/)![0]);
      cell.setAttribute(
        "s",
        String(cellStyle(Number(cell.getAttribute("s") || 0), row)),
      );
    }
    write(path, serializer.serializeToString(sheet));
  }
  write("xl/styles.xml", serializer.serializeToString(styles));
}
