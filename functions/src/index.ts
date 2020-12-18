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

export const justMail = functions.https.onCall(async (data) => {
  const msg = {
    to: data.email,
    from: 'tsukasakasa1231@gmail.com',
    subject: data.subject,
    text: 'some text and yeah',
    templateId: TEMPLATE_ID,
    dynamic_template_data: {
      url: data.url,
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

//------
import * as mailgun from "mailgun-js"

// const cors = require('cors')({ origin: true });
const DOMAIN = 'sandboxecd78c1c06ac41c4acc9164806f01e60.mailgun.org';
const api_key = '96e9bc6d72211113b8211431446cdb86-e5da0167-6039970f';
const mg = mailgun({ apiKey: api_key, domain: DOMAIN });

exports.sendEmail = functions.firestore.document(`groups/{Id}`).onCreate(async (snapshot, context) => {
      const data = {
          from: 'maxchen.sihhan@gmail.com',
          to: 'tsukasakasa1231@gmail.com',
          subject: 'test',
          text: 'test',
          html: '<html><head></head><body> hello world</body></html>',
      };
      mg.messages().send(data, (error, body) => {
          console.log(body);
      });
  });


// exports.contactUs = functions.https.onRequest((req, res) => {
//   return _cors(req, res, () => {
//     const data = {
//       from: req.body.email,
//       to: 'To address',
//       subject: req.body.subject,
//       message: req.body.message,
//     };
//     mg.messages().send(data, (error: any, body: any) => {
//       body
//         ? res.status(200).send('Email Sent Successfullly !')
//         : res.status(500).send(error);
//     });
//   });
// });
