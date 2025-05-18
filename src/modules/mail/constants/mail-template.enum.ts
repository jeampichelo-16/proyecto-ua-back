export enum MailTemplate {
  SENDPASSWORD = "send-password",
  RESET_PASSWORD = "reset-password",
  SEND_RECEIPT = "send-receipt",
  PAY_CONFIRMATION = "pay-confirmation",
  OPERATION_DETAILS = "operation-details",
  // puedes agregar más: WELCOME = 'welcome', NEWSLETTER = 'newsletter', etc.
}

export enum MailTypeSender {
  MAILBOT = "mailbot",
  MAILZOHO = "mailzoho",
}
