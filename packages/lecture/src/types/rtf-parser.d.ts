declare module 'rtf-parser' {
  type RtfParserCallback = (err: Error | null, doc: any) => void;

  type RtfParser = {
    string: (text: string, callback: RtfParserCallback) => void;
  };

  const parser: RtfParser;
  export default parser;
}
