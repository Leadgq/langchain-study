import DxfParser from 'dxf-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// interface ComponentLocation {
//   position: [number, number];  // [x, y] 坐标
//   label: number;               // 标签编号
//   name?: string;               // 组件名称
//   type?: string;               // 组件类型
// }

export function parseDxfFile() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const dxfPath = path.join(__dirname, '../assets/test.dxf');
    const fileContent = fs.readFileSync(dxfPath, 'utf-8');
    const parser = new DxfParser();
    
    try {
        if (typeof parser.parseSync === 'function') {
            const dxf = parser.parseSync(fileContent);
            return dxf;
        }
    } catch (err) {
        console.error('解析失败:', err.message);
        return null;
    }
}

// 核心函数：提取指定类型的组件位置
function extractComponentLocations(
    dxfData,
    componentType
) {
    if (!dxfData || !dxfData.entities) {
        return [];
    }

    const components = [];
    let labelCounter = 1;

    // 遍历DXF中的所有实体
    dxfData.entities.forEach((entity) => {
        const layerName = entity.layer || '';
        
        // 检查图层名称是否包含目标组件类型
        if (layerName.includes(componentType)) {
            // 提取位置坐标
            const position = extractPosition(entity);
            
            if (position) {
                components.push({
                    position,
                    label: labelCounter,
                    name: entity.name || `${componentType}_${labelCounter}`,
                    type: componentType,
                });
                labelCounter++;
            }
        }
    });

    return components;
}

// 辅助函数：从不同类型的DXF实体中提取坐标
function extractPosition(entity){
    // 处理不同的DXF实体类型
    if (entity.x !== undefined && entity.y !== undefined) {
        // POINT、INSERT等实体直接有x, y属性
        return [Math.round(entity.x), Math.round(entity.y)];
    }
    
    if (entity.position && Array.isArray(entity.position)) {
        // 某些实体的position是数组
        return [
            Math.round(entity.position[0]),
            Math.round(entity.position[1])
        ];
    }

    if (entity.start) {
        // LINE实体的起点
        return [
            Math.round(entity.start.x || entity.start[0]),
            Math.round(entity.start.y || entity.start[1])
        ];
    }

    if (entity.center) {
        // CIRCLE、ARC实体的中心
        return [
            Math.round(entity.center.x || entity.center[0]),
            Math.round(entity.center.y || entity.center[1])
        ];
    }

    if (entity.vertices && entity.vertices.length > 0) {
        // POLYLINE的第一个顶点
        const firstVertex = entity.vertices[0];
        return [
            Math.round(firstVertex.x || firstVertex[0]),
            Math.round(firstVertex.y || firstVertex[1])
        ];
    }

    return null;
}

// 主函数：整合所有组件提取
export function extractAllComponentsFromDXF(dxfPath){
    // 使用提供的路径或默认路径
    let dxf = parseDxfFile();
    if (!dxf) {
        console.warn('无法解析DXF文件');
        return {
            smokeDetectors: [],
            alarmBells: [],
            buttons: [],
            allComponents: []
        };
    }

    // 提取各类型的组件
    const smokeDetectors = extractComponentLocations(dxf, '感烟探测器');
    const alarmBells = extractComponentLocations(dxf, '警铃');
    const buttons = extractComponentLocations(dxf, '按钮');

    // 合并所有组件
    const allComponents = [
        ...smokeDetectors,
        ...alarmBells,
        ...buttons
    ];

    return {
        smokeDetectors,
        alarmBells,
        buttons,
        allComponents
    };
}

// 导出为JSON格式
export function exportComponentsToJSON(filename = 'components.json') {
    const data = extractAllComponentsFromDXF();
    
    // 转换为目标格式
    const output = {
        metadata: {
            exportTime: new Date().toISOString(),
            totalComponents: data.allComponents.length,
        },
        components: {
            smokeDetectors: data.smokeDetectors,
            alarmBells: data.alarmBells,
            buttons: data.buttons,
        },
        rawData: data.allComponents
    };

    fs.writeFileSync(filename, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`组件数据已导出至 ${filename}`);
}

// 使用示例
const components = extractAllComponentsFromDXF();

console.log('=== 感烟探测器 ===');
components.smokeDetectors.forEach(detector => {
    console.log(`标签 ${detector.label}: 位置 [${detector.position[0]}, ${detector.position[1]}]`);
});

console.log('\n=== 警铃 ===');
components.alarmBells.forEach(bell => {
    console.log(`标签 ${bell.label}: 位置 [${bell.position[0]}, ${bell.position[1]}]`);
});

console.log('\n=== 按钮 ===');
components.buttons.forEach(button => {
    console.log(`标签 ${button.label}: 位置 [${button.position[0]}, ${button.position[1]}]`);
});

// 生成JSON文件
exportComponentsToJSON('dxf_components.json');

// 获取指定格式的输出
export function getFormattedOutput(componentType ) {
    const components = extractAllComponentsFromDXF();
    let targetComponents= [];

    if (componentType === '感烟探测器') {
        targetComponents = components.smokeDetectors;
    } else if (componentType === '警铃') {
        targetComponents = components.alarmBells;
    } else if (componentType === '按钮') {
        targetComponents = components.buttons;
    }

    // 返回简化格式：只有position和label
    return targetComponents.map(comp => ({
        position: comp.position,
        label: comp.label
    }));
}