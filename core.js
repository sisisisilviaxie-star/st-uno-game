console.log("🎮 [UNO] Core.js 正在运行...");

// 创建一个浮动的测试按钮，确认界面注入成功
const testBtn = document.createElement('div');
testBtn.innerHTML = "UNO 插件激活";
testBtn.style.position = "fixed";
testBtn.style.top = "10px";
testBtn.style.right = "10px";
testBtn.style.background = "red";
testBtn.style.color = "white";
testBtn.style.padding = "10px";
testBtn.style.zIndex = "9999";
testBtn.style.cursor = "pointer";
testBtn.onclick = () => alert("点击成功！环境已打通！");

document.body.appendChild(testBtn);
