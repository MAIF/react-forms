export const style = {
  input: {
    display: "block",
    width: "100%",
    padding: "8px 12px",
    fontSize: "1rem",
    color: "#495057",
    border: "1px solid #ced4da",
    borderRadius: 4,
    "&[readonly]": {
      backgroundColor: "#e9ecef",
      opacity: 1,
    },
  },
  btn: {
    borderRadius: 5,
    padding: 10,
    fontSize: "1rem",
    cursor: "pointer",
    border: 0,
  },
  btn_sm: {
    fontSize: "0.875rem",
    padding: ".25rem .5rem",
  },
  btn_group: {
    "& > button:not(:last-child)": {
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
    },
    "& > button:not(:first-child)": {
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
    },
  },
  btn_red: {
    color: "#fff",
    backgroundColor: "#dc3545",
    borderColor: "#dc3545",
    "&:hover": {
      backgroundColor: "#c82333",
      borderColor: "#bd2130",
    },
  },
  btn_green: {
    color: "#fff",
    backgroundColor: "#28a745",
    borderColor: "#28a745",
    "&:hover": {
      backgroundColor: "#218838",
      borderColor: "#1e7e34",
    },
  },
  btn_blue: {
    color: "#fff",
    backgroundColor: "#007bff",
    borderColor: "#007bff",
    "&:hover": {
      backgroundColor: "#0069d9",
      borderColor: "#0062cc",
    },
  },
  btn_grey: {
    color: "#fff",
    backgroundColor: "#6c757d",
    borderColor: "#6c757d",
    "&:hover": {
      backgroundColor: "#5c636a",
      borderColor: "#5c636a",
    },
  },
  txt_red: {
    color: "#dc3545",
  },
  ml_5: {
    marginLeft: 5,
  },
  ml_10: {
    marginLeft: 10,
  },
  mt_5: {
    marginTop: 5,
  },
  mt_10: {
    marginTop: 10,
  },
  mt_20: {
    marginTop: 20,
  },
  mb_5: {
    marginBottom: 5,
  },
  p_15: {
    padding: 15,
  },
  pr_15: {
    paddingRight: 15,
  },
  d_none: {
    display: "none",
  },
  flex: {
    display: "flex",
  },
  flexColumn: {
    flexDirection: "column",
  },
  justifyContentBetween: {
    justifyContent: "space-between",
  },
  jc_end: {
    justifyContent: "end",
  },
  ac_center: {
    alignContent: "center",
  },
  ai_center: {
    alignItems: "center",
  },
  cursor_pointer: {
    cursor: "pointer",
  },
  collapse: {
    display: "flex",
    justifyContent: "space-between",
    cursor: "pointer",
  },
  collapse_label: {
    fontWeight: "bold",
    marginTop: 7,
  },
  collapse_label: {
    fontWeight: "bold",
    marginTop: 7,
  },
  collapse_error: {
    color: '#dc3545'
  },
  datepicker: {
    "& input": {
      borderRadius: "4px",
    },
  },
  code: {},
  input__boolean__on: {
    color: "MediumSeaGreen"
  },
  input__boolean__off: {
    color: "tomato"
  },
  input__invalid: {
    borderColor: '#dc3545'
  },
  invalid_feedback: {
    width: "100%",
    marginTop: ".25rem",
    fontSize: "80%",
    color: "#dc3545"
  }
}