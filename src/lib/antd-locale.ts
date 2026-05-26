import th from "antd/es/date-picker/locale/th_TH";

/** Locale สำหรับ Ant Design DatePicker แสดงปี พ.ศ. (BBBB) */
export const buddhistPickerLocale: typeof th = {
  ...th,
  lang: {
    ...th.lang,
    fieldDateFormat: "BBBB-MM-DD",
    fieldDateTimeFormat: "BBBB-MM-DD HH:mm:ss",
    yearFormat: "BBBB",
    cellYearFormat: "BBBB"
  }
};
