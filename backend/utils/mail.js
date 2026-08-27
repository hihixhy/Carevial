const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// 不同场景的邮件模版
const buildCodeEmail = (purpose, code) => {
  const map = {
    register: {
      subject: 'Carevial注册验证码',
      tip: '您正在注册Carevial账号'
    },
    login: {
      subject: 'Carevial登录验证码',
      tip: '您正在使用验证码登录Carevial'
    },
    change_email: {
      subject: 'Carevial修改邮箱验证码',
      tip: '您正在修改Carevial绑定邮箱'
    }
  };

  const conf = map[purpose];
  if (!conf) {
    throw new Error(`未知邮件场景: ${purpose}`);
  }

  return {
    subject: conf.subject,
    html: `
      <div style="font-family: sans-serif; line-height: 1.6;">
        <p>${conf.tip}，验证码为：</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
        <p>验证码 5 分钟内有效，请勿泄露给他人。</p>
        <p style="color: #888;">如非本人操作，请忽略此邮件。</p>
      </div>
    `
  };
};

// 发送验证码邮件
const sendCodeEmail = async (to, purpose, code) => {
  const { subject, html } = buildCodeEmail(purpose, code);

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html
  });

  if (error) {
    console.error('Resend发送失败', error);
    throw new Error(error.message || '邮件发送失败');
  }

  return data;
};

module.exports = {
  sendCodeEmail
};
