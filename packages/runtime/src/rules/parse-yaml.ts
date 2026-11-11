import { parseDocument } from "yaml";

export const parseYaml = (text: string): unknown => {
  const document = parseDocument(text, {
    schema: "core",
    merge: false,
    uniqueKeys: true,
    prettyErrors: true,
  });
  const problems = [...document.errors, ...document.warnings];
  if (problems.length > 0) throw new Error(problems.map((problem) => problem.message).join("\n"));
  return document.toJS({ maxAliasCount: 0 });
};
