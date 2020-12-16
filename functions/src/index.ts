import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();
// const db = admin.firestore();
import * as sgMail from '@sendgrid/mail';
const API_KEY =
  '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';
// functions.config().sendgrid.key;
const TEMPLATE_ID = 'd-bfa159c80a744f8cbd067da765fada17';
sgMail.setApiKey(API_KEY);

// export const welcomeEmail = functions.auth.user().onCreate((user) => {
//   const msg = {
//     to: user.email,
//     from: 'maxchen.sihhan@gmail.com',
//     templateId: TEMPLATE_ID,
//     dynamic_template_dtat: {},
//   };

//   return sgMail.send(msg);
// });

// export const genericEmail = functions.https.onCall(
//   async (data, context: any) => {
//     if (!context.auth && !context.auth.token.email) {
//       throw new functions.https.HttpsError(
//         'failed-precondition',
//         'Must be logged with'
//       );
//     }
//     const msg = {
//       to: context.auth.toke.email,
//       from: 'maxchen.sihhan@gmail.com',
//       templateId: TEMPLATE_ID,
//       dynamic_template_dtat: {
//         subject: data.subject,
//         name: data.text,
//       },
//     };

//     await sgMail.send(msg);

//     return { success: true };
//   }
// );

export const justMail = functions.https.onCall(async (data) => {
  const msg = {
    to: data.email,
    from: 'tsukasakasa1231@gmail.com',
    subject: 'Secret Santa Generator ' + data.details.groupName + ' Result',
    text: 'some text and yeah',
    templateId: TEMPLATE_ID,
    dynamic_template_data: {
      subject: data.subject,
      target: data.target,
      groupName: data.details.groupName,
      dateOfExchange: data.details.dateOfExchange,
      budget: data.details.budget,
      invitationMessage: data.details.invitationMessage,
      zh: true,
    },
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error(error.errors);
    return error.errors;
  }
  return { success: true };
});
