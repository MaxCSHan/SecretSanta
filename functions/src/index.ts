import { IGroupInfo } from './../../src/app/interface/igroup-info';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();
import * as nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: functions.config().auth.user, // generated ethereal user
    pass: functions.config().auth.pass, // generated ethereal password
  },
});

exports.groupCreatedEmail = functions.firestore
  .document('groups/{groupId}')
  .onCreate((snapshot, context) => {
    const val = snapshot.data();
    // getting dest email by query string
    helper(val, val.host);
  });

// aux
function helper(val: any, user: any): void {
  const url = val.localeId
    ? `https://secret-santa-gen.firebaseapp.com/${val.localeId}/register/${val.Id}/`
    : `https://secret-santa-gen.firebaseapp.com/en/register/${val.Id}/`;
  const date = val.details.dateOfExchange.toDate() || 'Not Designated';
  const themes = val.details.themes.map((ele: any) => ele.name);
  let html = `<html>
  <head>
    <title>Secret Santa Generator Result</title>
    <link href="https://uiux.s3.amazonaws.com/style-guide/css/style-guide.css" rel="stylesheet">
    <style>
    .btn {
      outline=0;
      border:0;
      border-radius:0.5rem;
      background:#42a5f5
      height:1rem
    }
    .link {
      font-size:15px;
      line-height:20px;
      text-decoration: none;
      color:#ffffff;
      padding:1rem;
    }
    .module{
        background-image: url('https://static-cdn.drawnames.com/Content/Assets/deco-sending.svg');
        color:#444444;
        font-family: Arial, Helvetica, sans-serif;
        font-size:12px;
        line-height:20px;
        padding:16px 16px 16px 16px;
        text-align:Center;
        height:100%
    }
    .mes{
      word-break:break-all;
    }
  </style>
  </head>
  <body  style="height:100%;">

  <div data-role="module-unsubscribe" class="module" style="background-image: url('https://static-cdn.drawnames.com/Content/Assets/deco-sending.svg');
  color:#444444;
  font-family: Arial, Helvetica, sans-serif;
  font-size:12px;
  line-height:20px;
  padding:16px 16px 16px 16px;
  text-align:Center;
  height:100%" role="module" data-type="unsubscribe" data-muid="4e838cf3-9892-4a6d-94d6-170e474d21e5">
      <h1>Hi ${user.name},</h1>
      <h2>Your result for ${val.details.groupName}</h2>
      <div>Date: ${date}</div>
          <div>Theme: ${themes}</div>
      <div>Budget: ${val.details.currency}${val.details.budget} </div>
      <div class="mes">${val.details.invitationMessage}</div>

      </div>
     <button class="btn"><a class="link" href="${url}" >Go to website</a></button>
    </div>

  </body>
</html>`;

  if (val.localeId === 'zh') {
    html = `<html>
    <head>
      <title>Secret Santa Generator Result</title>
      <link href="https://uiux.s3.amazonaws.com/style-guide/css/style-guide.css" rel="stylesheet">
      <style>
      .btn {
        outline=0;
        border:0;
        border-radius:0.5rem;
        background:#42a5f5
        height:1rem
      }
      .link {
        font-size:15px;
        line-height:20px;
        text-decoration: none;
        color:#ffffff;
        padding:1rem;
      }
      .module{
          background-image: url('https://static-cdn.drawnames.com/Content/Assets/deco-sending.svg');
          color:#444444;
          font-family: Arial, Helvetica, sans-serif;
          font-size:12px;
          line-height:20px;
          padding:16px 16px 16px 16px;
          text-align:Center;
          height:100%
      }
      .mes{
        word-break:break-all;
      }
    </style>
    </head>
    <body  style="height:100%;">
        <div data-role="module-unsubscribe" class="module" style="background-image: url('https://static-cdn.drawnames.com/Content/Assets/deco-sending.svg');
        color:#444444;
        font-family: Arial, Helvetica, sans-serif;
        font-size:12px;
        line-height:20px;
        padding:16px 16px 16px 16px;
        text-align:Center;
        height:100%" role="module" data-type="unsubscribe" data-muid="4e838cf3-9892-4a6d-94d6-170e474d21e5">
      <div>
      <h1>嗨 ${user.name}，</h1>
      <h2>你是 ${val.details.groupName} 的活動主辦人，快跟你的朋友們分享抽籤結果！</h2>
      <div>活動日期: ${date}</div>
          <div>禮物主題: ${themes}</div>
      <div>預算:  ${val.details.currency}${val.details.budget}</div>
      <div class="mes">${val.details.invitationMessage}</div>
      <button class="btn"><a class="link" href="${url}" >Go to website</a></button>

      </div>

    </body>
  </html>`;
  }
  const mailOptions = {
    from: 'SecretSantaGenerator<secret.santa.gen.app@gmail.com>', // You can write any mail Adress you want this doesn't effect anything
    to: user.email, // This mail adress should be filled with any mail you want to read it
    titile: val.details.groupName,
    subject: `Results for ${val.details.groupName}`, // Sample Subject for you template
    html, // email content in HTML. You can write any Html template in here
  };
  transporter.sendMail(mailOptions,  (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Message sent: ' + info.response);
  });
}
// function helper1(val: IGroupInfo, date: string, user: any, userUrl: string) {

// }

exports.personalMail = functions.https.onCall((data, context) => {
  console.log('checkhere ', data.date);
  const groupinfo: IGroupInfo = data.groupinfo;
  // helper1(groupinfo, data.date, data.user, data.url);

  const url = `https://secret-santa-gen.firebaseapp.com/en/${data.userUrl}`;
  const themes = groupinfo.details.themes.map((ele: any) => ele.name);
  const anotherdate = groupinfo.details.dateOfExchange;
  const mailOptions = {
    from: 'SecretSantaGenerator<secret.santa.gen.app@gmail.com>', // You can write any mail Adress you want this doesn't effect anything
    to: data.user.email, // This mail adress should be filled with any mail you want to read it
    titile: groupinfo.details.groupName,
    subject: `Results for ${groupinfo.details.groupName}`, // Sample Subject for you template
    html: `<html>
    <head>
      <title>Secret Santa Generator Result</title>
      <link href="https://uiux.s3.amazonaws.com/style-guide/css/style-guide.css" rel="stylesheet">
      <style>
      .btn {
        outline=0;
        border:0;
        border-radius:0.5rem;
        background:#42a5f5
        height:1rem
      }
      .link {
        font-size:15px;
        line-height:20px;
        text-decoration: none;
        color:#ffffff;
        padding:1rem;
      }
      .module{
          background-image: url('https://static-cdn.drawnames.com/Content/Assets/deco-sending.svg');
          color:#444444;
          font-family: Arial, Helvetica, sans-serif;
          font-size:12px;
          line-height:20px;
          padding:16px 16px 16px 16px;
          text-align:Center;
          height:100%
      }
      .mes{
        word-break:break-all;
      }
    </style>
    </head>
    <body  style="height:100%;">
      <div data-role="module-unsubscribe" class="module" style="background-image: url('https://static-cdn.drawnames.com/Content/Assets/deco-sending.svg');
          color:#444444;
          font-family: Arial, Helvetica, sans-serif;
          font-size:12px;
          line-height:20px;
          padding:16px 16px 16px 16px;
          text-align:Center;
          height:100%" role="module" data-type="unsubscribe" data-muid="4e838cf3-9892-4a6d-94d6-170e474d21e5">
        <div>
        <h1>嗨 ${data.user.name}，</h1>
        <h2>這是來自${groupinfo.details.groupName} 的抽籤結果！</h2>
        <div>日期: ${data.date}</div>
        <div>日期:  ${anotherdate} </div>
        <div>日期: ${anotherdate.toDate}</div>
            <div>禮物主題: ${themes}</div>
        <div>預算:  ${groupinfo.details.currency}${groupinfo.details.budget}</div>
        <div class="mes">${groupinfo.details.invitationMessage}</div>

        </div>

        <div>
        <h1>Hi ${data.user.name},</h1>
        <h2>Your result for ${groupinfo.details.groupName}</h2>
        <div>Date: ${data.date}</div>
        <div>Date:  ${anotherdate} </div>
        <div>Date: ${anotherdate.toDate}</div>
            <div>Theme: ${themes}</div>
        <div>Budget: ${groupinfo.details.currency}${groupinfo.details.budget} </div>
        <div class="mes">${groupinfo.details.invitationMessage}</div>

        </div>
       <button class="btn"><a class="link" href="${url}" >Go to website</a></button>
      </div>

    </body>
  </html>`, // email content in HTML. You can write any Html template in here
  };
  transporter.sendMail(mailOptions,  (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Message sent: ' + info.response);
  });

  return { success: true };
});

exports.invitation = functions.https.onCall((data, context) => {
  console.log('checkhere ', data.date);
  const groupinfo: IGroupInfo = data.groupinfo;
  // helper1(groupinfo, data.date, data.user, data.url);

  const url = `https://secret-santa-gen.firebaseapp.com/en/${data.userUrl}`;
  const themes = groupinfo.details.themes.map((ele: any) => ele.name);
  const anotherdate = groupinfo.details.dateOfExchange;
  const mailOptions = {
    from: 'SecretSantaGenerator<secret.santa.gen.app@gmail.com>', // You can write any mail Adress you want this doesn't effect anything
    to: data.user.email, // This mail adress should be filled with any mail you want to read it
    titile: groupinfo.details.groupName,
    subject: `Results for ${groupinfo.details.groupName}`, // Sample Subject for you template
    html: `<html>
    <head>
      <title>Secret Santa Generator Result</title>
      <link href="https://uiux.s3.amazonaws.com/style-guide/css/style-guide.css" rel="stylesheet">
      <style>
      .btn {
        outline=0;
        border:0;
        border-radius:0.5rem;
        background:#42a5f5
        height:1rem
      }
      .link {
        font-size:15px;
        line-height:20px;
        text-decoration: none;
        color:#ffffff;
        padding:1rem;
      }
      .module{
          background-image: url('https://static-cdn.drawnames.com/Content/Assets/deco-sending.svg');
          color:#444444;
          font-family: Arial, Helvetica, sans-serif;
          font-size:12px;
          line-height:20px;
          padding:16px 16px 16px 16px;
          text-align:Center;
          height:100%
      }
      .mes{
        word-break:break-all;
      }
    </style>
    </head>
    <body  style="height:100%;">
      <div data-role="module-unsubscribe" class="module" style="background-image: url('https://static-cdn.drawnames.com/Content/Assets/deco-sending.svg');
          color:#444444;
          font-family: Arial, Helvetica, sans-serif;
          font-size:12px;
          line-height:20px;
          padding:16px 16px 16px 16px;
          text-align:Center;
          height:100%" role="module" data-type="unsubscribe" data-muid="4e838cf3-9892-4a6d-94d6-170e474d21e5">
        <div>
        <h1>嗨 ${data.user.name}，</h1>
        <h2>這是來自${groupinfo.details.groupName} 的抽籤結果！</h2>
        <div>日期: ${data.date}</div>
        <div>日期:  ${anotherdate} </div>
        <div>日期: ${anotherdate.toDate}</div>
            <div>禮物主題: ${themes}</div>
        <div>預算:  ${groupinfo.details.currency}${groupinfo.details.budget}</div>
        <div class="mes">${groupinfo.details.invitationMessage}</div>

        </div>

        <div>
        <h1>Hi ${data.user.name},</h1>
        <h2>Your result for ${groupinfo.details.groupName}</h2>
        <div>Date: ${data.date}</div>
        <div>Date:  ${anotherdate} </div>
        <div>Date: ${anotherdate.toDate}</div>
            <div>Theme: ${themes}</div>
        <div>Budget: ${groupinfo.details.currency}${groupinfo.details.budget} </div>
        <div class="mes">${groupinfo.details.invitationMessage}</div>

        </div>
       <button class="btn"><a class="link" href="${url}" >Go to website</a></button>
      </div>

    </body>
  </html>`, // email content in HTML. You can write any Html template in here
  };
  transporter.sendMail(mailOptions, (error, info)  =>  {
    if (error) {
      return console.log(error);
    }
    console.log('Message sent: ' + info.response);
  });

  return { success: true };
});
// export const justMail = functions.https.onCall(async (data) => {
//   const msg = {
//     to: data.email,
//     from: 'tsukasakasa1231@gmail.com',
//     subject: data.subject,
//     text: 'some text and yeah',
//     templateId: TEMPLATE_ID,
//     dynamic_template_data: {
//       url: data.url,
//       subject: data.subject,
//       target: data.target,
//       groupName: data.details.groupName,
//       dateOfExchange: data.details.dateOfExchange,
//       budget: data.details.budget,
//       invitationMessage: data.details.invitationMessage,
//       zh: true,
//     },
//   };

//   try {
//     await sgMail.send(msg);
//   } catch (error) {
//     console.error(error.errors);
//     return error.errors;
//   }

//   return { success: true };
// });
