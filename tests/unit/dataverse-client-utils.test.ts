import {
  parseMultipartResponse,
  esc,
} from "../../src/dataverse/dataverse-client.utils.js";

describe("esc()", () => {
  it("returns string unchanged when no single quotes present", () => {
    expect(esc("account")).toBe("account");
  });

  it("doubles single quotes to prevent OData injection", () => {
    expect(esc("O'Brien")).toBe("O''Brien");
  });

  it("handles multiple single quotes", () => {
    expect(esc("it's a 'test'")).toBe("it''s a ''test''");
  });

  it("returns empty string unchanged", () => {
    expect(esc("")).toBe("");
  });
});

describe("parseMultipartResponse()", () => {
  const buildMultipart = (boundary: string, parts: string[]): string => {
    let body = "";
    for (const part of parts) {
      body += `--${boundary}\r\n${part}\r\n`;
    }
    body += `--${boundary}--`;
    return body;
  };

  const mimeWrap = (httpStatus: string, jsonBody: string): string =>
    `Content-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\n` +
    `${httpStatus}\r\nContent-Type: application/json\r\n\r\n${jsonBody}`;

  it("returns empty array when body only contains boundary markers", () => {
    const result = parseMultipartResponse("--boundary--", "boundary");
    expect(result).toEqual([]);
  });

  it("parses a single successful 200 response", () => {
    const body = buildMultipart("batch1", [
      mimeWrap(
        "HTTP/1.1 200 OK",
        JSON.stringify({ value: [{ name: "Test" }] }),
      ),
    ]);

    const result = parseMultipartResponse(body, "batch1");

    expect(result).toHaveLength(1);
    expect((result[0] as { value: unknown[] }).value).toHaveLength(1);
  });

  it("wraps error responses with { error, status }", () => {
    const errorBody = JSON.stringify({
      error: { message: "Not Found", code: "0x80040217" },
    });
    const body = buildMultipart("batch2", [
      mimeWrap("HTTP/1.1 404 Not Found", errorBody),
    ]);

    const result = parseMultipartResponse(body, "batch2");

    expect(result).toHaveLength(1);
    const res = result[0] as { error: unknown; status: number };
    expect(res.status).toBe(404);
    expect(res.error).toBeDefined();
  });

  it("handles multiple parts in one response", () => {
    const body = buildMultipart("batchX", [
      mimeWrap("HTTP/1.1 200 OK", JSON.stringify({ value: [] })),
      mimeWrap("HTTP/1.1 204 No Content", ""),
      mimeWrap(
        "HTTP/1.1 400 Bad Request",
        JSON.stringify({ error: { message: "Bad" } }),
      ),
    ]);

    const result = parseMultipartResponse(body, "batchX");

    expect(result).toHaveLength(3);
    // 204 empty body → null for success
    expect(result[1]).toBeNull();
    // 400 → wrapped error
    const errRes = result[2] as { status: number };
    expect(errRes.status).toBe(400);
  });

  it("handles non-JSON body gracefully", () => {
    const body = buildMultipart("batchY", [
      mimeWrap("HTTP/1.1 500 Internal Server Error", "plain text error"),
    ]);

    const result = parseMultipartResponse(body, "batchY");

    expect(result).toHaveLength(1);
    const res = result[0] as { error: string; status: number };
    expect(res.status).toBe(500);
    expect(typeof res.error).toBe("string");
  });

  it("skips parts with no double-newline separator", () => {
    // A part without the MIME header separator should be skipped
    const body = `--bad\r\nno-separator-here\r\n--bad--`;
    const result = parseMultipartResponse(body, "bad");
    expect(result).toEqual([]);
  });

  it("uses LF-only double newline as separator", () => {
    // Some servers use \n\n instead of \r\n\r\n
    const part =
      `Content-Type: application/http\n\n` +
      `HTTP/1.1 200 OK\n` +
      `Content-Type: application/json\n\n` +
      JSON.stringify({ ok: true });

    const body = `--lfbatch\n${part}\n--lfbatch--`;

    const result = parseMultipartResponse(body, "lfbatch");
    expect(result).toHaveLength(1);
  });
});
