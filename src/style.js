const buttonOutline = (color, darker) => ({
  color,
  borderColor: color,
  "&:hover": {
    color: '#fff',
    backgroundColor: color,
    borderColor: darker,
  },
  "&.active": {
    color: '#fff',
    backgroundColor: color,
    borderColor: darker,
  },

})

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
    borderWidth: '1px',
    backgroundColor: '#fff'
  },
  btn_sm: {
    fontSize: "0.875rem",
    padding: ".25rem .5rem",
    lineHeight: "1.5",
    borderRadius: ".2rem"
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
  btn_red: buttonOutline("#dc3545", "#bd2130"),
  btn_green: buttonOutline("#28a745", "#1e7e34"),
  btn_blue: buttonOutline("#007bff", "#0069d9"),
  btn_grey: buttonOutline("#6c757d", "#5c636a"),
  txt_red: {
    color: "#dc3545",
  },
  ml_5: {
    marginLeft: 5,
  },
  ml_10: {
    marginLeft: 10,
  },
  mr_5: {
    marginRight: 5,
  },
  mr_10: {
    marginRight: 10,
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
  full_width: {
    width: '100%'
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
    borderColor: '#dc3545 !important',
  },
  invalid_feedback: {
    width: "100%",
    marginTop: ".25rem",
    fontSize: "80%",
    color: "#dc3545"
  },
  display__none: {
    display: "none"
  },
  collapse__inline: {
    "& .form-group+.form-group": {
      marginLeft: '20px'
    }
  },
  nestedform__border: {
    borderLeft: '2px solid lightGray',
    paddingLeft: '1rem',
    marginBottom: '.5rem',
    position: 'relative'
  }
}