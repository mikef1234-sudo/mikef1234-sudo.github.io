import AVFoundation
import AppKit
import CoreGraphics
import CoreMedia
import CoreVideo
import Foundation

let width = 1080
let height = 1920
let fps: Int32 = 30
let durationSeconds = 16
let totalFrames = Int(fps) * durationSeconds

let outputURL = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
  .appendingPathComponent("admin/growth-studio/clarpoint-website-clarity-reel.mp4")

try? FileManager.default.removeItem(at: outputURL)

let writer = try AVAssetWriter(outputURL: outputURL, fileType: .mp4)
let outputSettings: [String: Any] = [
  AVVideoCodecKey: AVVideoCodecType.h264,
  AVVideoWidthKey: width,
  AVVideoHeightKey: height,
  AVVideoCompressionPropertiesKey: [
    AVVideoAverageBitRateKey: 8_000_000,
    AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel
  ]
]

let writerInput = AVAssetWriterInput(mediaType: .video, outputSettings: outputSettings)
writerInput.expectsMediaDataInRealTime = false

let sourceBufferAttributes: [String: Any] = [
  kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32ARGB),
  kCVPixelBufferWidthKey as String: width,
  kCVPixelBufferHeightKey as String: height,
  kCVPixelBufferCGImageCompatibilityKey as String: true,
  kCVPixelBufferCGBitmapContextCompatibilityKey as String: true
]

let adaptor = AVAssetWriterInputPixelBufferAdaptor(
  assetWriterInput: writerInput,
  sourcePixelBufferAttributes: sourceBufferAttributes
)

guard writer.canAdd(writerInput) else {
  fatalError("Could not add writer input.")
}

writer.add(writerInput)
writer.startWriting()
writer.startSession(atSourceTime: .zero)

let teal = NSColor(calibratedRed: 15 / 255, green: 118 / 255, blue: 110 / 255, alpha: 1)
let ink = NSColor(calibratedRed: 20 / 255, green: 34 / 255, blue: 32 / 255, alpha: 1)
let muted = NSColor(calibratedRed: 57 / 255, green: 81 / 255, blue: 76 / 255, alpha: 1)
let gold = NSColor(calibratedRed: 197 / 255, green: 140 / 255, blue: 16 / 255, alpha: 1)
let blue = NSColor(calibratedRed: 33 / 255, green: 88 / 255, blue: 216 / 255, alpha: 1)
let paper = NSColor(calibratedRed: 247 / 255, green: 246 / 255, blue: 239 / 255, alpha: 1)

func easeOut(_ value: CGFloat) -> CGFloat {
  let clamped = max(0, min(1, value))
  return 1 - pow(1 - clamped, 3)
}

func rgba(_ color: NSColor, alpha: CGFloat) -> NSColor {
  color.withAlphaComponent(alpha)
}

func drawRoundedRect(_ context: CGContext, rect: CGRect, radius: CGFloat, fill: NSColor) {
  let path = CGPath(roundedRect: rect, cornerWidth: radius, cornerHeight: radius, transform: nil)
  context.addPath(path)
  context.setFillColor(fill.cgColor)
  context.fillPath()
}

func paragraph(lineHeight: CGFloat, alignment: NSTextAlignment = .left) -> NSMutableParagraphStyle {
  let style = NSMutableParagraphStyle()
  style.minimumLineHeight = lineHeight
  style.maximumLineHeight = lineHeight
  style.alignment = alignment
  return style
}

func drawText(
  _ text: String,
  rect: CGRect,
  font: NSFont,
  color: NSColor,
  lineHeight: CGFloat,
  weight: NSFont.Weight = .regular
) {
  let attributed = NSAttributedString(
    string: text,
    attributes: [
      .font: font,
      .foregroundColor: color,
      .paragraphStyle: paragraph(lineHeight: lineHeight)
    ]
  )

  attributed.draw(with: rect, options: [.usesLineFragmentOrigin, .usesFontLeading])
}

func drawBackground(context: CGContext, time: Double) {
  let gradient = CGGradient(
    colorsSpace: CGColorSpaceCreateDeviceRGB(),
    colors: [paper.cgColor, NSColor(calibratedRed: 237 / 255, green: 242 / 255, blue: 239 / 255, alpha: 1).cgColor] as CFArray,
    locations: [0, 1]
  )!

  context.drawLinearGradient(
    gradient,
    start: CGPoint(x: 0, y: 0),
    end: CGPoint(x: CGFloat(width), y: CGFloat(height)),
    options: []
  )

  let pulse = CGFloat((sin(time * 2.4) * 0.5) + 0.5)

  context.setFillColor(rgba(teal, alpha: 0.12).cgColor)
  context.fillEllipse(in: CGRect(x: -30 + pulse * 50, y: 80, width: 360, height: 360))

  context.setFillColor(rgba(gold, alpha: 0.1).cgColor)
  context.fillEllipse(in: CGRect(x: 690, y: 260 + pulse * 40, width: 240, height: 240))

  context.setFillColor(rgba(blue, alpha: 0.11).cgColor)
  context.fillEllipse(in: CGRect(x: 650 - pulse * 40, y: 1180, width: 340, height: 340))

  context.setStrokeColor(rgba(ink, alpha: 0.05).cgColor)
  context.setLineWidth(1)
  for x in stride(from: 0, through: width, by: 80) {
    context.move(to: CGPoint(x: x, y: 0))
    context.addLine(to: CGPoint(x: x, y: height))
    context.strokePath()
  }
  for y in stride(from: 0, through: height, by: 80) {
    context.move(to: CGPoint(x: 0, y: y))
    context.addLine(to: CGPoint(x: width, y: y))
    context.strokePath()
  }

  drawText(
    "CLARPOINT",
    rect: CGRect(x: 84, y: 70, width: 320, height: 48),
    font: NSFont.systemFont(ofSize: 42, weight: .heavy),
    color: teal,
    lineHeight: 46
  )
  drawText(
    "Website and digital presence support",
    rect: CGRect(x: 84, y: 124, width: 420, height: 28),
    font: NSFont.systemFont(ofSize: 24, weight: .bold),
    color: ink,
    lineHeight: 28
  )
}

func drawBottomCaption(context: CGContext, label: String, copy: String) {
  drawRoundedRect(
    context,
    rect: CGRect(x: 78, y: 1560, width: 924, height: 236),
    radius: 30,
    fill: rgba(ink, alpha: 0.92)
  )

  drawText(
    label.uppercased(),
    rect: CGRect(x: 126, y: 1604, width: 180, height: 26),
    font: NSFont.systemFont(ofSize: 24, weight: .heavy),
    color: NSColor(calibratedRed: 127 / 255, green: 224 / 255, blue: 213 / 255, alpha: 1),
    lineHeight: 26
  )

  drawText(
    copy,
    rect: CGRect(x: 126, y: 1652, width: 826, height: 120),
    font: NSFont.systemFont(ofSize: 34, weight: .bold),
    color: .white,
    lineHeight: 44
  )
}

func drawLargeHeadline(context: CGContext, text: String, progress: CGFloat) {
  let top = 300 + easeOut(progress) * 12
  drawText(
    text,
    rect: CGRect(x: 82, y: top, width: 910, height: 620),
    font: NSFont.systemFont(ofSize: 78, weight: .heavy),
    color: ink,
    lineHeight: 88
  )
}

func drawHook(context: CGContext, progress: CGFloat) {
  drawLargeHeadline(context: context, text: "The offer is strong,\nbut the website\nmessage is vague\nand hard to scan.", progress: progress)
  drawBottomCaption(context: context, label: "Hook", copy: "A strong offer still needs a message people can understand quickly.")
}

func drawMessyScene(context: CGContext, progress: CGFloat, time: Double) {
  drawLargeHeadline(context: context, text: "The work is moving,\nbut nobody has\na clean view of\nwhat matters.", progress: progress)

  let pulse = CGFloat((sin(time * 2.4) * 0.5) + 0.5)
  let cardY: CGFloat = 840

  for index in 0..<3 {
    let x = 90 + CGFloat(index) * 320 + sin(CGFloat(progress + CGFloat(index)) * 3) * 8
    let y = cardY + (index % 2 == 0 ? 0 : 42) + pulse * 8
    drawRoundedRect(context, rect: CGRect(x: x, y: y, width: 280, height: 220), radius: 20, fill: rgba(.white, alpha: 0.88))

    let title = index == 0 ? "Open tabs" : (index == 1 ? "Messy notes" : "Mixed signals")
    drawText(
      title,
      rect: CGRect(x: x + 26, y: y + 24, width: 220, height: 28),
      font: NSFont.systemFont(ofSize: 24, weight: .heavy),
      color: ink,
      lineHeight: 28
    )

    for line in 0..<4 {
      let widths: [CGFloat] = [228, 188, 150, 210]
      drawRoundedRect(
        context,
        rect: CGRect(x: x + 26, y: y + 74 + CGFloat(line * 30), width: widths[line], height: 14),
        radius: 7,
        fill: rgba(ink, alpha: 0.11)
      )
    }
  }

  drawBottomCaption(
    context: context,
    label: "Scene 1",
    copy: "Show messy updates, open tabs, or unclear notes while the voiceover says, “The work is moving, but nobody has a clean view of what matters.”"
  )
}

func drawCalmScene(context: CGContext, progress: CGFloat, time: Double) {
  drawLargeHeadline(context: context, text: "Clarpoint brings\nstructure, sharper\ncommunication,\nand a stronger\nexecution path.", progress: progress)

  drawRoundedRect(context, rect: CGRect(x: 108, y: 900, width: 864, height: 560), radius: 30, fill: rgba(.white, alpha: 0.92))

  drawText(
    "Clarity roadmap",
    rect: CGRect(x: 156, y: 938, width: 280, height: 34),
    font: NSFont.systemFont(ofSize: 34, weight: .heavy),
    color: ink,
    lineHeight: 38
  )

  let pulse = CGFloat((sin(time * 2.4) * 0.5) + 0.5)
  let items: [(String, NSColor, CGFloat)] = [("Plan", teal, 0.82), ("Message", gold, 0.72), ("Launch", blue, 0.76)]

  for (index, item) in items.enumerated() {
    let y = 1050 + CGFloat(index * 126)
    drawText(
      item.0,
      rect: CGRect(x: 156, y: y - 10, width: 120, height: 30),
      font: NSFont.systemFont(ofSize: 30, weight: .bold),
      color: muted,
      lineHeight: 34
    )

    drawRoundedRect(context, rect: CGRect(x: 310, y: y - 16, width: 560, height: 28), radius: 14, fill: rgba(ink, alpha: 0.09))
    drawRoundedRect(context, rect: CGRect(x: 310, y: y - 16, width: 560 * (item.2 + pulse * 0.03), height: 28), radius: 14, fill: item.1)
  }

  drawBottomCaption(
    context: context,
    label: "Scene 2",
    copy: "Shift to a calmer screen, roadmap, or cleaner homepage while the voiceover says, “Clarpoint brings structure, sharper communication, and a stronger execution path.”"
  )
}

func drawOfferScene(context: CGContext, progress: CGFloat) {
  drawLargeHeadline(context: context, text: "Website and\ndigital presence\nsupport.", progress: progress)

  drawRoundedRect(context, rect: CGRect(x: 92, y: 980, width: 896, height: 330), radius: 30, fill: rgba(.white, alpha: 0.9))

  drawText(
    "Outcome",
    rect: CGRect(x: 140, y: 1022, width: 140, height: 26),
    font: NSFont.systemFont(ofSize: 26, weight: .heavy),
    color: teal,
    lineHeight: 30
  )

  drawText(
    "Clear plans. Stronger\ncommunication. Better\nexecution.",
    rect: CGRect(x: 140, y: 1082, width: 760, height: 210),
    font: NSFont.systemFont(ofSize: 62, weight: .heavy),
    color: ink,
    lineHeight: 72
  )

  drawText(
    "Cleaner positioning, sharper calls to action, and a more credible digital presence.",
    rect: CGRect(x: 140, y: 1298, width: 760, height: 90),
    font: NSFont.systemFont(ofSize: 30, weight: .bold),
    color: muted,
    lineHeight: 40
  )

  drawBottomCaption(
    context: context,
    label: "Scene 3",
    copy: "Highlight website and digital presence support and the outcome: “Clear plans. Stronger communication. Better execution.”"
  )
}

func drawClose(context: CGContext, progress: CGFloat) {
  drawText(
    "CLARPOINT",
    rect: CGRect(x: 50, y: 1280, width: 980, height: 180),
    font: NSFont.systemFont(ofSize: 170, weight: .heavy),
    color: rgba(ink, alpha: 0.08),
    lineHeight: 180
  )

  drawLargeHeadline(context: context, text: "Get a website\nor project review.", progress: progress)
  drawRoundedRect(context, rect: CGRect(x: 88, y: 1030, width: 484, height: 80), radius: 40, fill: teal)
  drawText(
    "https://clarpoint.co/",
    rect: CGRect(x: 118, y: 1052, width: 380, height: 34),
    font: NSFont.systemFont(ofSize: 34, weight: .heavy),
    color: .white,
    lineHeight: 36
  )

  drawText(
    "Use this as the final CTA frame for the reel close.",
    rect: CGRect(x: 90, y: 1184, width: 660, height: 80),
    font: NSFont.systemFont(ofSize: 34, weight: .bold),
    color: muted,
    lineHeight: 44
  )

  drawBottomCaption(context: context, label: "Close", copy: "On-screen CTA: Get a website or project review | https://clarpoint.co/")
}

func renderScene(time: Double, context: CGContext) {
  drawBackground(context: context, time: time)

  switch time {
  case 0..<4.2:
    drawHook(context: context, progress: CGFloat(time / 4.2))
  case 4.2..<8.6:
    drawMessyScene(context: context, progress: CGFloat((time - 4.2) / 4.4), time: time)
  case 8.6..<12.6:
    drawCalmScene(context: context, progress: CGFloat((time - 8.6) / 4.0), time: time)
  case 12.6..<14.5:
    drawOfferScene(context: context, progress: CGFloat((time - 12.6) / 1.9))
  default:
    drawClose(context: context, progress: CGFloat((time - 14.5) / 1.5))
  }
}

func makePixelBuffer(pool: CVPixelBufferPool) -> CVPixelBuffer? {
  var pixelBuffer: CVPixelBuffer?
  let status = CVPixelBufferPoolCreatePixelBuffer(nil, pool, &pixelBuffer)
  return status == kCVReturnSuccess ? pixelBuffer : nil
}

for frame in 0..<totalFrames {
  while !writerInput.isReadyForMoreMediaData {
    Thread.sleep(forTimeInterval: 0.01)
  }

  autoreleasepool {
    guard
      let pool = adaptor.pixelBufferPool,
      let pixelBuffer = makePixelBuffer(pool: pool)
    else {
      fatalError("Could not create pixel buffer.")
    }

    CVPixelBufferLockBaseAddress(pixelBuffer, [])
    let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer)!
    let bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer)

    guard let context = CGContext(
      data: baseAddress,
      width: width,
      height: height,
      bitsPerComponent: 8,
      bytesPerRow: bytesPerRow,
      space: CGColorSpaceCreateDeviceRGB(),
      bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue
    ) else {
      fatalError("Could not create drawing context.")
    }

    context.translateBy(x: 0, y: CGFloat(height))
    context.scaleBy(x: 1, y: -1)

    let graphicsContext = NSGraphicsContext(cgContext: context, flipped: true)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = graphicsContext
    renderScene(time: Double(frame) / Double(fps), context: context)
    NSGraphicsContext.restoreGraphicsState()

    CVPixelBufferUnlockBaseAddress(pixelBuffer, [])

    let presentationTime = CMTime(value: CMTimeValue(frame), timescale: fps)
    adaptor.append(pixelBuffer, withPresentationTime: presentationTime)
  }
}

writerInput.markAsFinished()

let semaphore = DispatchSemaphore(value: 0)
writer.finishWriting {
  semaphore.signal()
}
semaphore.wait()

if writer.status == .completed {
  print(outputURL.path)
} else {
  fputs("Failed: \(writer.error?.localizedDescription ?? "Unknown error")\n", stderr)
  exit(1)
}
