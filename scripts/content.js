// content.js

function initExecute() {

  let fileName = 'conversation';

  execute();

  function execute() {
    fileName = getCurrentConversationName();
    let contentsQA = document.querySelectorAll('[class="w-full text-token-text-primary"]');

    setInterval(() => {
      fileName = getCurrentConversationName();
      contentsQA = document.querySelectorAll('[class="w-full text-token-text-primary"]');

      createCodeFile();

      initMessageCountDom();
    }, 3000);


    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
      if (message.selected === 'addPrompt') {

        console.log('add prompt: ' + message.cmd + '\n' + message.prompt);
        handleAddButtonClick(message.cmd, message.prompt);

      } else if (message.selected === 'deletePrompt') {

        console.log('delete prompt: ' + message.cmd);
        handleDeleteButtonClick(message.cmd);

      } else if (message.selected === 'pdfDown') {

        console.log('saveQAndAAsPDF');
        saveQAndAAsPDF(contentsQA);

      } else if (message.selected === 'markDown') {

        console.log('saveQAndAAsMarkdown');
        saveQAndAAsMarkdown(contentsQA);

      } else if (message.selected === 'textDown') {

        console.log('saveQAndAAsText');
        saveQAndAAsText(contentsQA);

      } else if (message.selected === 'uploadFile') {

        console.log('uploadFile');
        uploadFile();

      }
    });
  }


  function handleAddButtonClick(cmdInput, promptInput) {
    if (!cmdInput || !promptInput) {
      console.log('none');
      return;
    }

    var prompts = '';
    var isContainsChinese = containsChinese(cmdInput);
    if (isContainsChinese && cmdInput.startsWith('#')) {
      prompts = localStorage.getItem('prompts-zh');
      if (!prompts) {
        prompts = JSON.stringify(jsonDataZh)
        localStorage.setItem('prompts-zh', prompts);
      }
    } else {
      prompts = localStorage.getItem('prompts-eng');
      if (!prompts) {
        var data = JSON.stringify(jsonData);
        localStorage.setItem('prompts-eng', data);
        prompts = data;
      } 
    }

    prompts = JSON.parse(prompts);
    var index = prompts.findIndex(function(entry) {
      return entry.cmd === cmdInput;
    });


    if (index !== -1) {
      prompts.splice(index, 1);
    }
    
    var newEntry = {
      "cmd": cmdInput,
      "prompt": promptInput
    };

    prompts.push(newEntry);

    if (isContainsChinese && cmdInput.startsWith('#')) {
      localStorage.setItem('prompts-zh', JSON.stringify(prompts));
    } else {
      localStorage.setItem('prompts-eng', JSON.stringify(prompts));
    }
  }

  function handleDeleteButtonClick(cmdInput) {
    if (!cmdInput) {
      return;
    }

    var isContainsChinese = containsChinese(cmdInput);
    var prompts = '';

    if (isContainsChinese && cmdInput.startsWith('#')) {
      prompts = localStorage.getItem('prompts-zh');
    } else {
      prompts = localStorage.getItem('prompts-eng');
    }

    if (!prompts) {
      return;
    }

    var deleteData = JSON.parse(prompts);

    var index = deleteData.findIndex(function(entry) {
      return entry.cmd === cmdInput;
    });

    if (index !== -1) {
      deleteData.splice(index, 1);
    } else {
      return;
    }

    if (isContainsChinese && cmdInput.startsWith('#')) {
      localStorage.setItem('prompts-zh', JSON.stringify(deleteData));
    } else {
      localStorage.setItem('prompts-eng', JSON.stringify(deleteData));
    }
  }

  function containsChinese(text) {
    const chineseRegex = /[\u4e00-\u9fa5]/; // Regular expression to match Chinese characters
    return chineseRegex.test(text);
  }

  
  function getCurrentConversationName() {
    const nav = document.querySelector('nav');
    if (nav == null) {
      return fileName;
    }
    const chatList = nav.querySelectorAll('li');
    if (chatList == null) {
      return fileName;
    }
    const list = [];
    for (const chat of chatList) {
      const c = chat.querySelector('a');
      if (c) {
        const name = {href: c['href'], chatName: c.textContent};
        list.push(name);
      }
    }

    const href = window.location.href;
    for (const li of list) {
      if (li.href === href) {
        fileName = li.chatName;
        break;
      }
    }

    return fileName;
  }

  function saveQAndAAsPDF(contentsQA) {
    // Create a new jsPDF instance
    const doc = new window.jspdf.jsPDF();
    const fontPath = './fonts/simsunb.ttf';
    // Register the font with jsPDF
    doc.addFileToVFS(fontPath, font);
    doc.addFont(fontPath, 'simsunb', 'normal');
    doc.setFont('simsunb');

    let y = 10;
    for (let i = 1, j = 1; i < contentsQA.length; i += 2, j++) {
      const question = contentsQA[i - 1].textContent.trim().replace('You', '');
      const answer = contentsQA[i].textContent.trim().replace('ChatGPTChatGPT', '');

      // convert the question content
      const questionWithoutPageNumber = question.replace(/^\d+ \/ \d+/, '');
      const questionsLines = doc.splitTextToSize(questionWithoutPageNumber, 185);
      doc.text(10, y, `Q${j}: ${questionsLines[0]}`);
      y += 6;
      for (let j = 1; j < questionsLines.length; j++) {
        if (y + 10 > doc.internal.pageSize.getHeight()) {
          doc.addPage();
          y = 6;
        }
        doc.text(10, y, `${questionsLines[j]}`);
        y += 6;
      }
      y += 1;

      // convert the answer content
      const answerLines = doc.splitTextToSize(answer, 185);
      doc.text(10, y, `A: ${answerLines[0]}`);
      y += 6;
      for (let j = 1; j < answerLines.length; j++) {
        if (y + 10 > doc.internal.pageSize.getHeight()) {
          doc.addPage();
          y = 6;
        }
        doc.text(10, y, `${answerLines[j]}`);
        y += 6;
      }
      y += 6;
    }

    doc.save(fileName + '.pdf');
  }


  function saveQAndAAsMarkdown(contentsQA) {
    let markdownContent = '';

    for (let i = 1, j = 1; i < contentsQA.length; i += 2, j++) {
      const question = contentsQA[i - 1].textContent.trim().replace('You', '');
      const answer = contentsQA[i].textContent.trim().replace('ChatGPTChatGPT', '');

      const questionWithoutPageNumber = question.replace(/^\d+ \/ \d+/, '');
      markdownContent += `**Q${j}:** ${questionWithoutPageNumber}\n\n`;
      markdownContent += '```markdown\n';
      markdownContent += `${answer}\n`;
      markdownContent += '```\n\n';
    }

    downloadFileByType('.md', markdownContent);
  }


  function saveQAndAAsText(contentsQA) {
    let textContent = '';

    for (let i = 1, j = 1; i < contentsQA.length; i += 2, j++) {
      const question = contentsQA[i - 1].textContent.trim().replace('You', '');
      const answer = contentsQA[i].textContent.trim().replace('ChatGPTChatGPT', '');

      const questionWithoutPageNumber = question.replace(/^\d+ \/ \d+/, '');
      textContent += `Q${j}: ${questionWithoutPageNumber}\n`;
      textContent += `A: ${answer}\n\n`;
    }

    downloadFileByType('.txt', textContent);    
  }

  function downloadFileByType(type, content) {
    const link = document.createElement('a');
    link.href = `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
    link.download = fileName + type;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function uploadFile() {
    const upload = document.createElement('input');
    upload.type = 'file';
    upload.accept = '.txt, .pdf, .docx, .xlsx, .xml, .js, .py, .html, .css, .json, .c, .cpp, .java, .go, .rs, .php, .sql, .jsp, .R, .cs, .ini, .properties, .swift';

    upload.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      const reader = new FileReader();
      const currentConversationName = getCurrentConversationName();
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.5.207/pdf.worker.min.js';

      if (file.type === 'application/pdf') {
        uploadPDFFile(file, reader, currentConversationName);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        uploadWordFile(file, reader, currentConversationName);
      } else  if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        uploadExcelFile(file, reader, currentConversationName);
      } else {
        uploadPlainTextFile(file, reader, currentConversationName);
      }
    });

    upload.click();
  }


  function submitConversation(text, part, filename) {
    const textarea = document.querySelector("textarea");
    const inputEvent = new Event('input', {
      bubbles: true,
      cancelable: true,
    });
    textarea.value = `Part ${part} of ${filename}:\n\n${text}`;
    textarea.dispatchEvent(inputEvent);
  }


  function uploadPDFFile(file, reader, currentConversationName) {
    reader.onload = async (event) => {
      const typedarray = new Uint8Array(event.target.result);

      // Load the PDF using PDF.js
      const pdf = await pdfjsLib.getDocument(typedarray).promise;
      const numPages = pdf.numPages;
      for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
        const currentName = getCurrentConversationName();
        if (currentConversationName !== currentName && currentName !== fileName) {
          console.log('Conversation has been changed');
          break;
        }

        let text = '';

        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');

        // Append page text to the overall text
        text += `Page ${pageNumber}:\n${pageText}\n\n`;

        await submitConversation(text, pageNumber, file.name);
        
        const submit = document.getElementById('prompt-textarea');
        if (submit) {
          submit.nextElementSibling.click();
        }

        let chatgptReady = false;
        while (!chatgptReady) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          const stopGenerating = document.querySelector('.btn.relative.btn-neutral.border-0.md\\:border');
          if (stopGenerating) {
            chatgptReady = stopGenerating.textContent !== "Stop generating";
          }
        }

        text = '';
      }
    };

    reader.readAsArrayBuffer(file);
  }


  function setSizeByModel() {
    var chunkSize = 1024;
    const modelType = getModelType();
    if (modelType && modelType.textContent === 'GPT-4') {
      chunkSize = chunkSize * 4;
    } else {
      chunkSize = chunkSize * 10;
    }

    return chunkSize;
  }


  function uploadWordFile(file, reader, currentConversationName) {
    reader.onload = async (event) => {
      const arrayBuffer = event.target.result;

      // Convert the Word file to HTML using mammoth.js
      const result = await new Promise((resolve, reject) => {
        const options = {
          arrayBuffer: arrayBuffer,
        };

        mammoth.extractRawText(options)
          .then((result) => {
            resolve(result.value);
          })
          .catch((error) => {
            reject(error);
          });
      });

      const chunkSizeInBytes = setSizeByModel();
      const chunkSize = Math.floor(chunkSizeInBytes / 2); // 1 JavaScript character is 2 bytes
      const text = result.replace(/\n/g, ' '); // Replace line breaks with spaces

      const chunks = [];
      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
      }

      for (let i = 0; i < chunks.length; i++) {
        const currentName = getCurrentConversationName();
        if (currentConversationName != currentName && currentName !== fileName) {
          console.log('Conversation has been changed');
          break;
        }

        const chunkContent = chunks[i];
        const chunkNumber = i + 1;

        await submitConversation(chunkContent, chunkNumber, file.name);

        const submit = document.getElementById('prompt-textarea');
        if (submit) {
          submit.nextElementSibling.click();
        }

        let chatgptReady = false;
        while (!chatgptReady) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          const stopGenerating = document.querySelector('.btn.relative.btn-neutral.border-0.md\\:border');
          if (stopGenerating) {
            chatgptReady = stopGenerating.textContent !== "Stop generating";
          }
        }
      }
    };

    reader.readAsArrayBuffer(file);
  }


  function uploadExcelFile(file, reader, currentConversationName) {
    reader.onload = async (event) => {
      let data = new Uint8Array(event.target.result);
      let workbook = XLSX.read(data, {type: 'array'});

      const chunkSizeInBytes = setSizeByModel(); // adjust this as needed

      // Function to split array into chunks
      function chunkArray(myArray, chunk_size_in_bytes){
          let results = [];
          let chunk = [];
          let chunkSize = 0;
          for (const item of myArray) {
              const itemSize = JSON.stringify(item).length * 2;
              if (chunkSize + itemSize > chunk_size_in_bytes) {
                  results.push(chunk);
                  chunk = [item];
                  chunkSize = itemSize;
              } else {
                  chunk.push(item);
                  chunkSize += itemSize;
              }
          }
          if (chunk.length > 0) {
              results.push(chunk);
          }
          return results;
      }

      // Iterate over each sheet
      for (let sheetName of workbook.SheetNames) {
          let worksheet = workbook.Sheets[sheetName];
          let jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});

          const currentName = getCurrentConversationName();
          if (currentConversationName !== currentName && currentName !== fileName) {
            console.log('Conversation has been changed');
            break;
          }

          // Split jsonData into chunks
          let chunks = chunkArray(jsonData, chunkSizeInBytes);

          for(let i = 0; i < chunks.length; i++) {
            const currentName = getCurrentConversationName();
            if (currentConversationName !== currentName && currentName !== fileName) {
              console.log('Conversation has been changed');
              break;
            }
            await submitConversation(chunks[i], i + 1, file.name);

            const submit = document.getElementById('prompt-textarea');
            if (submit) {
                submit.nextElementSibling.click();
            }

            let chatgptReady = false;
            while (!chatgptReady) {
                await new Promise((resolve) => setTimeout(resolve, 5000));
                const stopGenerating = document.querySelector('.btn.relative.btn-neutral.border-0.md\\:border');
                if (stopGenerating) {
                  chatgptReady = stopGenerating.textContent !== "Stop generating";
                }
            }
        }
      }
    };

    reader.readAsArrayBuffer(file);
  }


  async function uploadPlainTextFile(file, reader, currentConversationName) {
    const chunkSize = setSizeByModel();
    let offset = 0;
    let part = 1;

    while (offset < file.size) {
      const currentName = getCurrentConversationName();
      if (currentConversationName !== currentName && currentName !== fileName) {
        console.log('Conversation has been changed');
        break;
      }
        
      const chunk = file.slice(offset, offset + chunkSize);
      const text = await new Promise((resolve) => {
        reader.onload = (event) => resolve(event.target.result);
        reader.readAsText(chunk);
      });

      await submitConversation(text, part, file.name);

      const submit = document.getElementById('prompt-textarea');
      if (submit) {
        submit.nextElementSibling.click();
      }

      let chatgptReady = false;
      while (!chatgptReady) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        const stopGenerating = document.querySelector('.btn.relative.btn-neutral.border-0.md\\:border');
        if (stopGenerating) {
          chatgptReady = stopGenerating.textContent !== "Stop generating";
        }
      }

      offset += chunkSize;
      part++;
    }

    const submit = document.getElementById('prompt-textarea');
    if (submit && submit.value) {
      submit.nextElementSibling.click();
    }
  }


  function createCodeFile() {
    let domClass = getCodeBlockByAIType();

    const codeLists = document.querySelectorAll(domClass.codeBlock);
    codeLists.forEach(codeContainer => {
      if (codeContainer.querySelector("#createfile")) {
        return;
      }

      const createFileButton = document.createElement("button");
      createFileButton.textContent = "Create";
      createFileButton.id = "createfile";
      createFileButton.style.padding = "2px 10px";
      createFileButton.style.border = "none";
      createFileButton.style.borderRadius = "20px";
      createFileButton.style.color = "#fff";
      createFileButton.style.backgroundColor = "#28a745";
      createFileButton.style.fontWeight = "300";
      createFileButton.addEventListener("click", async () => {
        const codeType = codeContainer.querySelector(domClass.codeType);
        let typeLists = '{ "codes" : [' +
            '{"lang": "java", "suffix": ".java"},' + 
            '{"lang": "javascript", "suffix": ".js"},' +
            '{"lang": "css", "suffix": ".css"},' +
            '{"lang": "python", "suffix": ".py"},' +
            '{"lang": "cpp", "suffix": ".cpp"},' +
            '{"lang": "c", "suffix": ".c"},' +
            '{"lang": "go", "suffix": ".go"},' +
            '{"lang": "html", "suffix": ".html"},' +
            '{"lang": "rust", "suffix": ".rs"},' +
            '{"lang": "php", "suffix": ".php"},' +
            '{"lang": "shell", "suffix": ".sh"},' +
            '{"lang": "mysql", "suffix": ".sql"},' +
            '{"lang": "c#", "suffix": ".cs"},' + 
            '{"lang": "json", "suffix": ".json"},' +
            '{"lang": "properties", "suffix": ".properties"},' + 
            '{"lang": "ini", "suffix": ".ini"},' + 
            '{"lang": "xml", "suffix": ".xml"},' + 
            '{"lang": "kotlin ", "suffix": ".kt"},' + 
            '{"lang": "swift", "suffix": ".swift"},' + 
            '{"lang": "jsp", "suffix": ".jsp"},' + 
            '{"lang": "R", "suffix": ".R"}]}';

        types = JSON.parse(typeLists);
        let type = '.txt';
        let typeFound = false;
        if (codeType) {
          for (let i = 0; i < types.codes.length; i++) {
            if (codeType.textContent.trim() === types.codes[i].lang) {
              type = types.codes[i].suffix;
              typeFound = true;
              break;
            }
          }
        }

        if (!typeFound) {
          for (let i = 0; i < types.codes.length; i++) {
            if (codeType.textContent.trim() === types.codes[i].suffix.substr(1)) {
              type = types.codes[i].suffix;
              break;
            }
          }
        }
        
        const filename = `new${type}`;

        const parentDiv = codeContainer.parentElement;
        const codeContent = parentDiv.querySelector(domClass.code).textContent;

        const blob = new Blob([codeContent], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
      });

      createFileButton.style.marginRight = "220px";

      codeContainer.insertAdjacentElement("afterbegin", createFileButton);
    });
  }

  let detectChanged = 1;
  new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {

      mutation.addedNodes.forEach((node) => {
        let domClass = getCodeBlockByAIType();
        if ( node.nodeType === Node.ELEMENT_NODE && node.matches(domClass.codeBlock)) {
          createCodeFile();
        }

        
        if (node.nodeType === Node.ELEMENT_NODE && node.matches('.w-full.text-token-text-primary')) {
          console.log('Changed: ' + node.classList);
          if ((detectChanged & 1) === 1) {
            handleEvent();
          }
          detectChanged++;
        }

        // Monitor for the dynamically appearing button ===> Save & Submit
        if (node.nodeType === Node.ELEMENT_NODE && node.matches('[class="text-center mt-2 flex justify-center"]')) {
          const saveSButton = document.querySelector('[class="btn relative btn-primary mr-2"]');
          if (!saveSButton.myEventListener) { // Check if the event is already added
            saveSButton.addEventListener('click', handleEvent);
            saveSButton.myEventListener = true; // Flag that the event listener is added
          }
        }
      });
    });
  }).observe(document.body, { childList: true, subtree: true });



  function getCodeBlockByAIType() {
    let domClass = {
      codeBlock: '.flex.items-center.relative.text-gray-200.bg-gray-800.px-4.py-2.text-xs.font-sans.justify-between.rounded-t-md',
      codeType: '.flex.items-center.relative.text-gray-200.bg-gray-800.px-4.py-2.text-xs.font-sans.justify-between.rounded-t-md span',
      code: '.p-4.overflow-y-auto code'
    };

    return domClass;
  }

  function initMessageCountDom() {
    // Check if the elements already exist
    if (document.getElementById('modelGPT-4') || document.getElementById('modelGPT-3')) {
      return;
    }

    const divElement = document.querySelector('#prompt-textarea');
    
    if (divElement) {
      const spanElement = document.createElement("span");
      const modelType = getModelType();
      spanElement.id = `model${modelType}`;
      spanElement.style.color = '#1b6d85';
      spanElement.style.fontFamily = 'Microsoft YaBlack';

      let messageCount = 0;
      
      if (modelType === 'GPT-4') {
        // Handle GPT-4 logic
        const time = 3 * 60 * 60 * 1000;
        const currentTime = parseInt(Date.now());
        const savedStartTime = localStorage.getItem(`modelStartTime-${modelType}`);
        if (savedStartTime) {
          const elapsedTime = currentTime - savedStartTime;
          const remainingTime = time - elapsedTime;
          
          if (remainingTime > 0) {
            messageCount = localStorage.getItem(spanElement.id) || 0;
          }
        }
      } else {
        // Handle GPT-3 logic
        const now = new Date().getDate();
        const start = parseInt(localStorage.getItem('modelTime'));
        
        if (start && now === start) {
          messageCount = localStorage.getItem(spanElement.id) || 0;
        }
      }
      
      // Set the message count and append the elements
      spanElement.textContent = messageCount;
      const sentNode = document.createElement("div");
      sentNode.id = "sentCount";
      sentNode.style.color= "#1b6d85";
      sentNode.style.fontFamily = 'Microsoft YaBlack';
      sentNode.textContent= "Sent: ";
      sentNode.style.marginLeft = '10px';
      sentNode.style.marginRight = '3px';
      sentNode.setAttribute('title', "Total messages sent");

      divElement.parentNode.parentNode.appendChild(sentNode);
      divElement.parentNode.parentNode.appendChild(spanElement);
    }
  }

  // Initialize flags and counters
  let timerStarted = { 'GPT-3': false, 'GPT-4': false };
  let timers = {};

  function handleEvent() {
    const modelType = getModelType();
    if (!modelType) return;

    if (!timerStarted[modelType]) {
      startTimer(modelType);
    }

    const messageCount = incrementMessageCount(modelType);
    updateMessageCountDisplay(messageCount, modelType);
  }

  function getModelType() {
    const divElement = document.querySelector('[class="text-token-text-secondary"]');
    if (divElement == null) {
      return "GPT-3";
    }

    const model = divElement.textContent;
    if (model === '3.5') {
      console.log("The selected modelType is " + model);

      return 'GPT-3';
    }

    return 'GPT-4';
  }

  function startTimer(modelType) {
    timerStarted[modelType] = true;

    if (modelType === 'GPT-3') {
      const now = parseInt(new Date().getDate());
      let start = parseInt(localStorage.getItem('modelTime'));

      if (!start || now !== start) {
        localStorage.setItem(`model${modelType}`, 0);
        updateMessageCountDisplay(0, modelType);
        localStorage.setItem('modelTime', now);
      }
    } else {
      dynamicUpdateMessageCount(modelType);
    }
  }

  function dynamicUpdateMessageCount(modelType) {
    const time = 3 * 60 * 60 * 1000;
    const currentTime = parseInt(new Date().getTime());
    const savedStartTime = parseInt(localStorage.getItem(`modelStartTime-${modelType}`));

    if (!savedStartTime) {
      localStorage.setItem(`modelStartTime-${modelType}`, currentTime);
      timers[modelType] = setTimeout(() => {
        resetMessageCount(modelType);
      }, time);
    } else {
      const elapsedTime = currentTime - savedStartTime;
      const remainingTime = time - elapsedTime;
      
      if (remainingTime > 0) {
        console.log('Not over three hours, continue the count');
        // Restart the timer with the remaining time
        timers[modelType] = setTimeout(() => {
          resetMessageCount(modelType);
        }, remainingTime);
      } else {
        console.log('Over three hours, restart the count');
        resetMessageCount(modelType);
        const startTime = parseInt(new Date().getTime());
        localStorage.setItem(`modelStartTime-${modelType}`, startTime);
      }
    }
  }

  function incrementMessageCount(modelType) {
    let count = parseInt(localStorage.getItem(`model${modelType}`) || 0);
    count++;
    localStorage.setItem(`model${modelType}`, count);
    return count;
  }

  function updateMessageCountDisplay(count, modelType) {
    const countElement = document.getElementById(`model${modelType}`);
    if (countElement) {
      countElement.textContent = count;
    }
  }

  function resetMessageCount(modelType) {
    localStorage.setItem(`model${modelType}`, 0);
    updateMessageCountDisplay(0, modelType);
    timerStarted[modelType] = false;
  }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initExecute();
} else {
  document.addEventListener('DOMContentLoaded', initExecute);
}