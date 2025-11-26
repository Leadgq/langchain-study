// 图片生成函数
async function generateImage(prompt, options = {}) {
    try {
        const {
            size = "1024x1024",  // 可选尺寸: "256x256", "512x512", "1024x1024", "1792x1024", "1024x1792"
            quality = "standard", // "standard" 或 "hd"
            n = 1               // 生成图片数量
        } = options;

        console.log("开始生成图片，提示词:", prompt);

        // 使用 OpenAI 客户端的完成方法进行图片生成
        const response = await fetch(`${process.env.BASE_URL}/images/generations`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "dall-e-3",
                prompt: prompt,
                size: size,
                quality: quality,
                n: Math.min(n, 1), // DALL-E 3 目前只支持一次生成一张图片
                response_format: "url" // 返回图片URL
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${error.error?.message || ''}`);
        }

        const result = await response.json();

        if (result.data && result.data.length > 0) {
            const imageUrl = result.data[0].url;
            console.log("图片生成成功!");
            console.log("图片URL:", imageUrl);

            // 下载图片到本地
            const localImagePath = await downloadImage(imageUrl, prompt);
            console.log("图片已保存到:", localImagePath);

            return {
                url: imageUrl,
                localPath: localImagePath,
                revisedPrompt: result.data[0].revised_prompt
            };
        } else {
            throw new Error("未收到生成的图片");
        }
    } catch (error) {
        console.error("图片生成失败:", error.message);
        throw error;
    }
}

// 下载图片到本地
async function downloadImage(imageUrl, prompt) {
    try {
        const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
        const imagesDir = path.join(__dirname, "../generated-images");

        // 确保目录存在
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }

        // 生成文件名 (使用时间戳和提示词的前20个字符)
        const timestamp = Date.now();
        const cleanPrompt = prompt.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').substring(0, 20);
        const filename = `image_${timestamp}_${cleanPrompt}.png`;
        const filePath = path.join(imagesDir, filename);

        // 下载图片
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`下载失败: ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(buffer));

        return filePath;
    } catch (error) {
        console.error("下载图片失败:", error);
        throw error;
    }
}

// 批量生成图片函数
async function generateMultipleImages(prompts, options = {}) {
    const results = [];

    for (let i = 0; i < prompts.length; i++) {
        try {
            console.log(`\n生成第 ${i + 1}/${prompts.length} 张图片...`);
            const result = await generateImage(prompts[i], options);
            results.push({
                prompt: prompts[i],
                success: true,
                ...result
            });

            // 添加延迟以避免API限制
            if (i < prompts.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.error(`第 ${i + 1} 张图片生成失败:`, error.message);
            results.push({
                prompt: prompts[i],
                success: false,
                error: error.message
            });
        }
    }

    return results;
}


// 图片生成示例函数
async function demonstrateImageGeneration() {
    console.log("\n=== 图片生成演示 ===");

    const examplePrompts = [
        "一只可爱的橙色小猫坐在彩虹上，卡通风格",
        "未来科技城市的夜景，赛博朋克风格",
        "中国传统山水画，水墨画风格"
    ];

    try {
        // 生成单张图片
        console.log("\n--- 生成单张图片 ---");
        const singleImageResult = await generateImage(
            "一只穿着太空服的狗在月球上，旁边有地球的背景，数字艺术风格",
            {
                size: "1024x1024",
                quality: "standard"
            }
        );

        // 批量生成图片
        console.log("\n--- 批量生成图片 ---");
        const batchResults = await generateMultipleImages(examplePrompts);

        console.log("\n--- 图片生成总结 ---");
        console.log(`成功生成 ${batchResults.filter(r => r.success).length}/${batchResults.length} 张图片`);

        batchResults.forEach((result, index) => {
            if (result.success) {
                console.log(`✓ 图片 ${index + 1}: ${result.prompt.substring(0, 30)}...`);
                console.log(`  本地路径: ${result.localPath}`);
            } else {
                console.log(`✗ 图片 ${index + 1} 失败: ${result.error}`);
            }
        });

    } catch (error) {
        console.error("图片生成演示失败:", error.message);
    }
}

// 主函数：执行文件识别和图片生成
async function runCompleteDemo() {
    console.log("=== LangChain 多模态处理演示 ===");

    // 1. 分析现有图片
    console.log("\n=== 1. 分析现有图片 ===");
    await analyzeImage();

    // 2. 分析文档
    console.log("\n=== 2. 分析文档 ===");
    await analyzeDocument();

    // 3. 图片生成演示
    console.log("\n=== 3. AI图片生成演示 ===");
    await demonstrateImageGeneration();

    console.log("\n=== 演示完成 ===");
}

// 如果你想只运行图片生成，可以使用这个函数
async function runImageGenerationOnly() {
    console.log("=== 专用于图片生成的演示 ===");
    await demonstrateImageGeneration();
}

runImageGenerationOnly();
