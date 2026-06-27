import { ZodError } from "zod";


async function tryParse(schema, data) {
  try {
    return { parsed: schema.parse(data), error: null };
  } catch (err) {
    if (err instanceof ZodError) {
      return { parsed: null, error: err.issues };
    }
    throw err;
  }
}



export default tryParse;