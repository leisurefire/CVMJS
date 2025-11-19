"""
使用 img2webp 实现 WebP 差分动画（官方推荐，支持完整优化）
"""


import os
import shutil
import subprocess
from pathlib import Path
from PIL import Image



def find_tool(name):
    """从脚本目录的 libwebp 中查找工具，找不到再查 PATH"""
    script_dir = Path(__file__).parent.absolute()
    local = script_dir / "libwebp-1.6.0-windows-x64" / "bin" / f"{name}.exe"
    if local.exists():
        return str(local)


    fallback = shutil.which(name)
    if fallback:
        return fallback


    raise RuntimeError(f"找不到 {name}.exe，请确保放在 libwebp-1.6.0-windows-x64/bin 下或添加到 PATH")



def extract_frames_to_png(input_path, frame_height, temp_dir):
    """拆帧并保存为 PNG（基于高度垂直拆分）"""
    img = Image.open(input_path)
    w, h = img.size
    frame_count = h // frame_height


    if temp_dir.exists():
        shutil.rmtree(temp_dir)
    temp_dir.mkdir()


    png_frames = []
    for i in range(frame_count):
        frame = img.crop((0, i * frame_height, w, (i + 1) * frame_height))
        png_path = temp_dir / f"frame_{i:04d}.png"
        frame.save(png_path, "PNG")
        png_frames.append(str(png_path))


    return png_frames



def create_animated_webp_with_img2webp(
    output_path,
    png_frames,
    duration,
    encoding_mode,
    quality,
    method,
    use_sharp_yuv,
    diff_config
):
    """
    使用 img2webp 创建动画（支持完整差分优化）
    
    img2webp 参数说明：
    -min_size: 启用差分优化（等同于 minimize_size）
    -kmin: 最小关键帧间隔
    -kmax: 最大关键帧间隔
    """
    img2webp = find_tool("img2webp")


    cmd = [img2webp]
    
    # 文件级选项（应用于整个动画）
    if diff_config and diff_config.get("enable", False):
        cmd += ["-min_size"]  # 启用差分优化
        kmin = diff_config.get("kmin", 3)
        kmax = diff_config.get("kmax", 5)
        cmd += ["-kmin", str(kmin), "-kmax", str(kmax)]
    
    # 循环次数（0 = 无限循环）
    cmd += ["-loop", "0"]
    
    # 编码模式
    if encoding_mode == "lossless":
        cmd += ["-lossless"]
    elif encoding_mode == "near_lossless":
        cmd += ["-near_lossless", str(quality)]
    else:  # lossy
        cmd += ["-lossy"]
        cmd += ["-q", str(quality)]
        cmd += ["-m", str(method)]
        
        if use_sharp_yuv:
            cmd += ["-sharp_yuv"]
    
    # 添加每帧（-d 指定持续时间）
    cmd += ["-d", str(duration)]
    
    # 添加所有帧文件
    cmd.extend(png_frames)
    
    # 输出文件
    cmd += ["-o", output_path]
    
    # 执行命令
    result = subprocess.run(cmd, check=True, capture_output=True, text=True)
    return result



def sprite_to_webp(
    input_path,
    output_path,
    frame_height=184,
    duration=100,
    encoding_mode="lossy",
    quality=85,
    method=6,
    use_sharp_yuv=True,
    diff_config=None
):
    """将雪碧图转换为 WebP 动画（使用 img2webp，基于高度垂直拆分）"""
    if diff_config is None:
        if encoding_mode in ("lossless", "near_lossless"):
            diff_config = {"enable": True, "kmin": 9, "kmax": 17}
        else:
            diff_config = {"enable": True, "kmin": 3, "kmax": 5}
    
    temp_dir = Path(f"_tmp_encode_{Path(input_path).stem}")
    
    try:
        # 1. 拆帧为 PNG（基于高度）
        png_frames = extract_frames_to_png(input_path, frame_height, temp_dir)
        
        # 2. 使用 img2webp 创建动画
        create_animated_webp_with_img2webp(
            output_path,
            png_frames,
            duration,
            encoding_mode,
            quality,
            method,
            use_sharp_yuv,
            diff_config
        )
        
        return os.path.getsize(output_path)
    
    finally:
        if temp_dir.exists():
            shutil.rmtree(temp_dir, ignore_errors=True)



def batch_convert(
    input_dir="images",
    output_dir="output",
    frame_height=184,
    duration=100,
    encoding_mode="lossy",
    quality=85,
    method=6,
    use_sharp_yuv=True,
    diff_config=None
):
    """批量转换目录下的所有 PNG 雪碧图为 WebP 动画（基于高度垂直拆分）"""
    base = Path(__file__).parent.absolute()
    input_path = base / input_dir
    output_path = base / output_dir
    os.makedirs(output_path, exist_ok=True)


    png_files = list(input_path.glob("*.png"))
    if not png_files:
        print(f"未找到 PNG 文件（目录: {input_path}）")
        return


    # 显示配置信息
    print("=" * 60)
    print("WebP 动画批量转换工具（img2webp 差分优化版）")
    print("=" * 60)
    print(f"使用 img2webp: {find_tool('img2webp')}")
    print(f"编码模式: {encoding_mode}")
    print(f"质量参数: {quality}")
    print(f"压缩方法: {method}")
    print(f"帧高度: {frame_height}px")
    print(f"帧时长: {duration}ms")
    
    if diff_config and diff_config.get("enable", False):
        print(f"差分优化: 已启用 (kmin={diff_config.get('kmin', 3)}, kmax={diff_config.get('kmax', 5)})")
    else:
        print("差分优化: 未启用")
    print("=" * 60)
    print()


    total_input_size = 0
    total_output_size = 0
    success_count = 0
    
    for i, p in enumerate(png_files, 1):
        out = output_path / (p.stem + ".webp")
        input_size = p.stat().st_size
        total_input_size += input_size
        
        print(f"[{i}/{len(png_files)}] {p.name} ({input_size/1024:.1f} KB)")
        
        try:
            output_size = sprite_to_webp(
                str(p),
                str(out),
                frame_height,
                duration,
                encoding_mode,
                quality,
                method,
                use_sharp_yuv,
                diff_config
            )
            total_output_size += output_size
            compression_ratio = (1 - output_size / input_size) * 100
            print(f"  ✓ 输出 → {output_size/1024:.1f} KB (压缩率: {compression_ratio:.1f}%)")
            success_count += 1
            
        except Exception as e:
            print(f"  ✗ 失败: {e}")
            import traceback
            traceback.print_exc()
    
    # 显示统计信息
    print()
    print("=" * 60)
    print("转换完成")
    print("=" * 60)
    print(f"成功: {success_count}/{len(png_files)}")
    print(f"输入总大小: {total_input_size/1024:.1f} KB")
    print(f"输出总大小: {total_output_size/1024:.1f} KB")
    if total_input_size > 0:
        total_compression = (1 - total_output_size / total_input_size) * 100
        print(f"总压缩率: {total_compression:.1f}%")
    print("=" * 60)



if __name__ == "__main__":
    batch_convert(
        input_dir="images",
        output_dir="output",
        frame_height=184,
        duration=50,
        encoding_mode="lossy",
        quality=75,
        method=6,
        use_sharp_yuv=True,
        diff_config={
            "enable": True,
            "kmin": 9,
            "kmax": 17
        }
    )
