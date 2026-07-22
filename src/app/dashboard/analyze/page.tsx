import { redirect } from "next/navigation";

/** The analysis flow moved out of the dashboard shell to its own focused
 * route — this redirect keeps any existing bookmark/link working. */
export default function Page() {
  redirect("/analyze");
}
