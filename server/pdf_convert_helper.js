async function generatePdf(html) {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Set the content of the page to your HTML
    await page.setContent(html);
  
    // Generate PDF buffer
    const pdfBuffer = await page.pdf({ width: '207px', height: '740px'
    // , fontMetrics: [{
    //     family: 'Nirmala UI',
    //     src: './public/fonts/Nirmala.ttf', // Replace with the path to your font file
    //   }, {
    //     family: 'Nirmala UI Semlight',
    //     src: './public/fonts/NirmalaS.ttf', // Replace with the path to your font file
    //   },{
    //     family: 'Nirmala UI Bold',
    //     src: './public/fonts/NirmalaB.ttf', // Replace with the path to your font file
    //   }
    // ],
   });
  
    await browser.close();
  
    return pdfBuffer;
  }

//   const QRCode = require("qrcode");
//   const { createCanvas, loadImage } = require("canvas");
  
// async function create(dataForQRcode, center_image, width, cwidth) {
//     const canvas = createCanvas(width, width);
//     QRCode.toCanvas(
//       canvas,
//       dataForQRcode,
//       {
//         errorCorrectionLevel: "H",
//         margin: 1,
//         color: {
//           dark: "#000000",
//           light: "#ffffff",
//         },
//       }
//     );
  
//     const ctx = canvas.getContext("2d");
//     const img = await loadImage(center_image);
//     const center = (width - cwidth) / 2;
//     // ctx.drawImage(img, 42, 65, 100, cwidth);
//     console.log(img.width, img.height);
//     ctx.drawImage(img, center , center, cwidth, cwidth);
//     return canvas.toDataURL("image/png");
//   }
  
const QRLogo = require('qr-with-logo');
async function create(dataForQRcode, center_image, width, cwidth) {
    let res = await QRLogo.generateQRWithLogo(dataForQRcode, center_image, {}, "Base64", "qrlogo.png", (base64) => {
        return base64;
    }).then((base64) => {console.log(base64); return base64; });

    if (res){
        console.log("QR code created");
        return res;
    }
    
}

  module.exports = {create, generatePdf};