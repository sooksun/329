import dayjs from "dayjs";
import buddhistEra from "dayjs/plugin/buddhistEra";
import customParseFormat from "dayjs/plugin/customParseFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/th";

dayjs.extend(buddhistEra);
dayjs.extend(customParseFormat);
dayjs.extend(relativeTime);
dayjs.locale("th");

export type { Dayjs } from "dayjs";
export default dayjs;
