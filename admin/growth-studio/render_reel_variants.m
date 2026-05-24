#import <Foundation/Foundation.h>
#import <AppKit/AppKit.h>
#import <AVFoundation/AVFoundation.h>
#import <CoreGraphics/CoreGraphics.h>
#import <CoreMedia/CoreMedia.h>
#import <CoreVideo/CoreVideo.h>

static const int kWidth = 1080;
static const int kHeight = 1920;
static const int kFPS = 30;

typedef struct {
  __unsafe_unretained NSString *slug;
  __unsafe_unretained NSString *voice;
  NSInteger rate;
  __unsafe_unretained NSString *hero;
  __unsafe_unretained NSString *sceneOneTitle;
  __unsafe_unretained NSString *sceneOneCaption;
  __unsafe_unretained NSString *sceneTwoTitle;
  __unsafe_unretained NSString *sceneTwoCaption;
  __unsafe_unretained NSString *sceneThreeTitle;
  __unsafe_unretained NSString *sceneThreeCaption;
  __unsafe_unretained NSString *closeTitle;
  __unsafe_unretained NSString *closeCaption;
  __unsafe_unretained NSString *voiceover;
} ReelVariant;

static void ReleasePixelBufferMemory(void *releaseRefCon, const void *baseAddress) {
  free((void *)baseAddress);
}

static inline CGFloat EaseOut(CGFloat value) {
  CGFloat clamped = MAX(0.0, MIN(1.0, value));
  return 1.0 - pow(1.0 - clamped, 3.0);
}

static NSMutableParagraphStyle *Paragraph(CGFloat lineHeight) {
  NSMutableParagraphStyle *style = [[NSMutableParagraphStyle alloc] init];
  style.minimumLineHeight = lineHeight;
  style.maximumLineHeight = lineHeight;
  return style;
}

static void DrawRoundedRect(CGContextRef context, CGRect rect, CGFloat radius, NSColor *fill) {
  CGPathRef path = CGPathCreateWithRoundedRect(rect, radius, radius, nil);
  CGContextAddPath(context, path);
  CGContextSetFillColorWithColor(context, fill.CGColor);
  CGContextFillPath(context);
  CGPathRelease(path);
}

static void DrawText(NSString *text, CGRect rect, NSFont *font, NSColor *color, CGFloat lineHeight) {
  NSDictionary *attributes = @{
    NSFontAttributeName: font,
    NSForegroundColorAttributeName: color,
    NSParagraphStyleAttributeName: Paragraph(lineHeight)
  };
  NSAttributedString *string = [[NSAttributedString alloc] initWithString:text attributes:attributes];
  [string drawWithRect:rect options:NSStringDrawingUsesLineFragmentOrigin | NSStringDrawingUsesFontLeading];
}

static void DrawBackground(CGContextRef context, double time, NSColor *paper, NSColor *teal, NSColor *gold, NSColor *blue, NSColor *ink) {
  CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
  NSArray *colors = @[(__bridge id)paper.CGColor, (__bridge id)[NSColor colorWithCalibratedRed:237 / 255.0 green:242 / 255.0 blue:239 / 255.0 alpha:1].CGColor];
  CGFloat locations[] = {0.0, 1.0};
  CGGradientRef gradient = CGGradientCreateWithColors(colorSpace, (__bridge CFArrayRef)colors, locations);
  CGContextDrawLinearGradient(context, gradient, CGPointMake(0, 0), CGPointMake(kWidth, kHeight), 0);
  CGGradientRelease(gradient);
  CGColorSpaceRelease(colorSpace);

  CGFloat pulse = (CGFloat)(sin(time * 2.2) * 0.5 + 0.5);
  CGContextSetFillColorWithColor(context, [teal colorWithAlphaComponent:0.12].CGColor);
  CGContextFillEllipseInRect(context, CGRectMake(-30 + pulse * 50, 80, 360, 360));
  CGContextSetFillColorWithColor(context, [gold colorWithAlphaComponent:0.10].CGColor);
  CGContextFillEllipseInRect(context, CGRectMake(690, 260 + pulse * 40, 240, 240));
  CGContextSetFillColorWithColor(context, [blue colorWithAlphaComponent:0.11].CGColor);
  CGContextFillEllipseInRect(context, CGRectMake(650 - pulse * 40, 1180, 340, 340));

  CGContextSetStrokeColorWithColor(context, [ink colorWithAlphaComponent:0.05].CGColor);
  CGContextSetLineWidth(context, 1);
  for (int x = 0; x <= kWidth; x += 80) {
    CGContextMoveToPoint(context, x, 0);
    CGContextAddLineToPoint(context, x, kHeight);
    CGContextStrokePath(context);
  }
  for (int y = 0; y <= kHeight; y += 80) {
    CGContextMoveToPoint(context, 0, y);
    CGContextAddLineToPoint(context, kWidth, y);
    CGContextStrokePath(context);
  }

  DrawText(@"CLARPOINT", CGRectMake(84, 70, 320, 48), [NSFont systemFontOfSize:42 weight:NSFontWeightHeavy], teal, 46);
  DrawText(@"Website and digital presence support", CGRectMake(84, 124, 440, 28), [NSFont systemFontOfSize:24 weight:NSFontWeightBold], ink, 28);
}

static void DrawBottomCaption(CGContextRef context, NSString *label, NSString *copy, NSColor *ink) {
  DrawRoundedRect(context, CGRectMake(78, 1560, 924, 236), 30, [ink colorWithAlphaComponent:0.92]);
  DrawText([label uppercaseString], CGRectMake(126, 1604, 220, 26), [NSFont systemFontOfSize:24 weight:NSFontWeightHeavy], [NSColor colorWithCalibratedRed:127 / 255.0 green:224 / 255.0 blue:213 / 255.0 alpha:1], 26);
  DrawText(copy, CGRectMake(126, 1652, 826, 120), [NSFont systemFontOfSize:32 weight:NSFontWeightBold], NSColor.whiteColor, 42);
}

static void DrawHeadline(CGContextRef context, NSString *text, CGFloat progress, NSColor *ink) {
  CGFloat top = 300 + EaseOut(progress) * 12;
  DrawText(text, CGRectMake(82, top, 910, 640), [NSFont systemFontOfSize:76 weight:NSFontWeightHeavy], ink, 86);
}

static void DrawMessyCards(CGContextRef context, NSColor *ink, double time) {
  CGFloat pulse = (CGFloat)(sin(time * 2.4) * 0.5 + 0.5);
  CGFloat cardY = 860;
  NSArray<NSString *> *titles = @[@"Open tabs", @"Messy notes", @"Mixed signals"];
  NSArray<NSNumber *> *lineWidths = @[@228, @188, @150, @210];

  for (NSInteger index = 0; index < 3; index += 1) {
    CGFloat x = 90 + index * 320 + sin((pulse + index) * 3) * 6;
    CGFloat y = cardY + (index % 2 == 0 ? 0 : 42) + pulse * 8;
    DrawRoundedRect(context, CGRectMake(x, y, 280, 220), 20, [NSColor colorWithWhite:1 alpha:0.88]);
    DrawText(titles[index], CGRectMake(x + 26, y + 24, 220, 28), [NSFont systemFontOfSize:24 weight:NSFontWeightHeavy], ink, 28);

    for (NSInteger line = 0; line < lineWidths.count; line += 1) {
      CGFloat width = lineWidths[line].doubleValue;
      DrawRoundedRect(context, CGRectMake(x + 26, y + 74 + line * 30, width, 14), 7, [ink colorWithAlphaComponent:0.11]);
    }
  }
}

static void DrawRoadmap(CGContextRef context, NSColor *ink, NSColor *muted, NSColor *teal, NSColor *gold, NSColor *blue, double time) {
  DrawRoundedRect(context, CGRectMake(108, 920, 864, 540), 30, [NSColor colorWithWhite:1 alpha:0.92]);
  DrawText(@"Clarity roadmap", CGRectMake(156, 958, 280, 34), [NSFont systemFontOfSize:34 weight:NSFontWeightHeavy], ink, 38);

  CGFloat pulse = (CGFloat)(sin(time * 2.2) * 0.5 + 0.5);
  NSArray *items = @[
    @{@"label": @"Plan", @"color": teal, @"width": @0.82},
    @{@"label": @"Message", @"color": gold, @"width": @0.72},
    @{@"label": @"Launch", @"color": blue, @"width": @0.76}
  ];

  [items enumerateObjectsUsingBlock:^(NSDictionary *item, NSUInteger index, BOOL *stop) {
    CGFloat y = 1070 + index * 126;
    DrawText(item[@"label"], CGRectMake(156, y - 10, 120, 30), [NSFont systemFontOfSize:30 weight:NSFontWeightBold], muted, 34);
    DrawRoundedRect(context, CGRectMake(310, y - 16, 560, 28), 14, [ink colorWithAlphaComponent:0.09]);
    CGFloat fillWidth = 560 * ([item[@"width"] doubleValue] + pulse * 0.03);
    DrawRoundedRect(context, CGRectMake(310, y - 16, fillWidth, 28), 14, item[@"color"]);
  }];
}

static void DrawOfferPanel(CGContextRef context, NSColor *ink, NSColor *muted, NSColor *teal, NSString *panelTitle, NSString *panelCopy) {
  DrawRoundedRect(context, CGRectMake(92, 980, 896, 330), 30, [NSColor colorWithWhite:1 alpha:0.90]);
  DrawText(@"Outcome", CGRectMake(140, 1022, 140, 26), [NSFont systemFontOfSize:26 weight:NSFontWeightHeavy], teal, 30);
  DrawText(panelTitle, CGRectMake(140, 1082, 760, 210), [NSFont systemFontOfSize:60 weight:NSFontWeightHeavy], ink, 70);
  DrawText(panelCopy, CGRectMake(140, 1298, 760, 90), [NSFont systemFontOfSize:28 weight:NSFontWeightBold], muted, 38);
}

static void DrawClosePanel(CGContextRef context, NSColor *ink, NSColor *muted, NSColor *teal, NSString *closeTitle, NSString *closeCaption) {
  DrawText(@"CLARPOINT", CGRectMake(50, 1280, 980, 180), [NSFont systemFontOfSize:170 weight:NSFontWeightHeavy], [ink colorWithAlphaComponent:0.08], 180);
  DrawText(closeTitle, CGRectMake(82, 300, 910, 500), [NSFont systemFontOfSize:76 weight:NSFontWeightHeavy], ink, 86);
  DrawRoundedRect(context, CGRectMake(88, 1030, 484, 80), 40, teal);
  DrawText(@"https://clarpoint.co/", CGRectMake(118, 1052, 380, 34), [NSFont systemFontOfSize:34 weight:NSFontWeightHeavy], NSColor.whiteColor, 36);
  DrawText(closeCaption, CGRectMake(90, 1184, 760, 90), [NSFont systemFontOfSize:32 weight:NSFontWeightBold], muted, 42);
}

static void RenderVariantFrame(CGContextRef context, ReelVariant variant, double time, double totalDuration, NSColor *paper, NSColor *teal, NSColor *gold, NSColor *blue, NSColor *ink, NSColor *muted) {
  DrawBackground(context, time, paper, teal, gold, blue, ink);

  double hookEnd = totalDuration * 0.24;
  double sceneOneEnd = totalDuration * 0.50;
  double sceneTwoEnd = totalDuration * 0.76;
  double sceneThreeEnd = totalDuration * 0.90;

  if (time < hookEnd) {
    DrawHeadline(context, variant.hero, (CGFloat)(time / hookEnd), ink);
    DrawBottomCaption(context, @"Hook", variant.sceneOneCaption, ink);
    return;
  }

  if (time < sceneOneEnd) {
    DrawHeadline(context, variant.sceneOneTitle, (CGFloat)((time - hookEnd) / MAX(sceneOneEnd - hookEnd, 0.001)), ink);
    DrawMessyCards(context, ink, time);
    DrawBottomCaption(context, @"Scene 1", variant.sceneOneCaption, ink);
    return;
  }

  if (time < sceneTwoEnd) {
    DrawHeadline(context, variant.sceneTwoTitle, (CGFloat)((time - sceneOneEnd) / MAX(sceneTwoEnd - sceneOneEnd, 0.001)), ink);
    DrawRoadmap(context, ink, muted, teal, gold, blue, time);
    DrawBottomCaption(context, @"Scene 2", variant.sceneTwoCaption, ink);
    return;
  }

  if (time < sceneThreeEnd) {
    DrawHeadline(context, variant.sceneThreeTitle, (CGFloat)((time - sceneTwoEnd) / MAX(sceneThreeEnd - sceneTwoEnd, 0.001)), ink);
    DrawOfferPanel(context, ink, muted, teal, @"Clear plans. Stronger\ncommunication. Better\nexecution.", variant.sceneThreeCaption);
    DrawBottomCaption(context, @"Scene 3", variant.sceneThreeCaption, ink);
    return;
  }

  DrawClosePanel(context, ink, muted, teal, variant.closeTitle, variant.closeCaption);
  DrawBottomCaption(context, @"Close", @"Get a website or project review at clarpoint.co.", ink);
}

static BOOL RunTask(NSArray<NSString *> *arguments, NSString *launchPath, NSError **taskError) {
  NSTask *task = [[NSTask alloc] init];
  task.launchPath = launchPath;
  task.arguments = arguments;
  [task launch];
  [task waitUntilExit];

  if (task.terminationStatus != 0) {
    if (taskError) {
      *taskError = [NSError errorWithDomain:@"ClarpointTask" code:task.terminationStatus userInfo:@{NSLocalizedDescriptionKey: [NSString stringWithFormat:@"Task failed: %@", launchPath]}];
    }
    return NO;
  }

  return YES;
}

static NSURL *BuildAudioFile(NSString *directory, ReelVariant variant, NSError **error) {
  NSString *aiffPath = [directory stringByAppendingPathComponent:[NSString stringWithFormat:@"%@.aiff", variant.slug]];
  [[NSFileManager defaultManager] removeItemAtPath:aiffPath error:nil];

  NSArray *sayArguments = @[
    @"-v", variant.voice,
    @"-r", [NSString stringWithFormat:@"%ld", (long)variant.rate],
    @"-o", aiffPath,
    variant.voiceover
  ];

  if (!RunTask(sayArguments, @"/usr/bin/say", error)) {
    return nil;
  }

  return [NSURL fileURLWithPath:aiffPath];
}

static BOOL RenderSilentVideo(NSURL *outputURL, ReelVariant variant, double totalDuration, NSError **error) {
  [[NSFileManager defaultManager] removeItemAtURL:outputURL error:nil];

  AVAssetWriter *writer = [[AVAssetWriter alloc] initWithURL:outputURL fileType:AVFileTypeMPEG4 error:error];
  if (!writer) {
    return NO;
  }

  NSDictionary *settings = @{
    AVVideoCodecKey: AVVideoCodecTypeH264,
    AVVideoWidthKey: @(kWidth),
    AVVideoHeightKey: @(kHeight),
    AVVideoCompressionPropertiesKey: @{
      AVVideoAverageBitRateKey: @8000000,
      AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel
    }
  };

  AVAssetWriterInput *input = [[AVAssetWriterInput alloc] initWithMediaType:AVMediaTypeVideo outputSettings:settings];
  input.expectsMediaDataInRealTime = NO;

  NSDictionary *attributes = @{
    (NSString *)kCVPixelBufferPixelFormatTypeKey: @(kCVPixelFormatType_32BGRA),
    (NSString *)kCVPixelBufferWidthKey: @(kWidth),
    (NSString *)kCVPixelBufferHeightKey: @(kHeight),
    (NSString *)kCVPixelBufferCGImageCompatibilityKey: @YES,
    (NSString *)kCVPixelBufferCGBitmapContextCompatibilityKey: @YES
  };

  AVAssetWriterInputPixelBufferAdaptor *adaptor = [[AVAssetWriterInputPixelBufferAdaptor alloc] initWithAssetWriterInput:input sourcePixelBufferAttributes:attributes];

  if (![writer canAddInput:input]) {
    if (error) {
      *error = [NSError errorWithDomain:@"ClarpointWriter" code:2 userInfo:@{NSLocalizedDescriptionKey: @"Unable to add video input."}];
    }
    return NO;
  }

  [writer addInput:input];
  [writer startWriting];
  [writer startSessionAtSourceTime:kCMTimeZero];

  NSColor *paper = [NSColor colorWithCalibratedRed:247 / 255.0 green:246 / 255.0 blue:239 / 255.0 alpha:1];
  NSColor *teal = [NSColor colorWithCalibratedRed:15 / 255.0 green:118 / 255.0 blue:110 / 255.0 alpha:1];
  NSColor *gold = [NSColor colorWithCalibratedRed:197 / 255.0 green:140 / 255.0 blue:16 / 255.0 alpha:1];
  NSColor *blue = [NSColor colorWithCalibratedRed:33 / 255.0 green:88 / 255.0 blue:216 / 255.0 alpha:1];
  NSColor *ink = [NSColor colorWithCalibratedRed:20 / 255.0 green:34 / 255.0 blue:32 / 255.0 alpha:1];
  NSColor *muted = [NSColor colorWithCalibratedRed:57 / 255.0 green:81 / 255.0 blue:76 / 255.0 alpha:1];

  int totalFrames = (int)ceil(totalDuration * kFPS);
  for (int frame = 0; frame < totalFrames; frame += 1) {
    while (!input.readyForMoreMediaData) {
      [NSThread sleepForTimeInterval:0.01];
    }

    @autoreleasepool {
      size_t bytesPerRow = kWidth * 4;
      void *rawBytes = calloc(kHeight, bytesPerRow);
      NSDictionary *bufferAttributes = @{
        (NSString *)kCVPixelBufferCGImageCompatibilityKey: @YES,
        (NSString *)kCVPixelBufferCGBitmapContextCompatibilityKey: @YES,
        (NSString *)kCVPixelBufferIOSurfacePropertiesKey: @{}
      };

      CVPixelBufferRef pixelBuffer = NULL;
      CVReturn status = CVPixelBufferCreateWithBytes(kCFAllocatorDefault, kWidth, kHeight, kCVPixelFormatType_32BGRA, rawBytes, bytesPerRow, ReleasePixelBufferMemory, NULL, (__bridge CFDictionaryRef)bufferAttributes, &pixelBuffer);
      if (status != kCVReturnSuccess || pixelBuffer == NULL) {
        if (error) {
          *error = [NSError errorWithDomain:@"ClarpointWriter" code:3 userInfo:@{NSLocalizedDescriptionKey: [NSString stringWithFormat:@"Pixel buffer failed: %d", status]}];
        }
        free(rawBytes);
        return NO;
      }

      CVPixelBufferLockBaseAddress(pixelBuffer, 0);
      void *baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer);
      size_t bufferBytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer);
      CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
      CGContextRef context = CGBitmapContextCreate(baseAddress, kWidth, kHeight, 8, bufferBytesPerRow, colorSpace, kCGImageAlphaPremultipliedFirst | kCGBitmapByteOrder32Little);
      CGColorSpaceRelease(colorSpace);
      if (!context) {
        if (error) {
          *error = [NSError errorWithDomain:@"ClarpointWriter" code:4 userInfo:@{NSLocalizedDescriptionKey: @"Failed to create drawing context."}];
        }
        CVPixelBufferUnlockBaseAddress(pixelBuffer, 0);
        CVPixelBufferRelease(pixelBuffer);
        return NO;
      }

      CGContextTranslateCTM(context, 0, kHeight);
      CGContextScaleCTM(context, 1.0, -1.0);

      NSGraphicsContext *graphicsContext = [NSGraphicsContext graphicsContextWithCGContext:context flipped:YES];
      [NSGraphicsContext saveGraphicsState];
      [NSGraphicsContext setCurrentContext:graphicsContext];
      RenderVariantFrame(context, variant, (double)frame / (double)kFPS, totalDuration, paper, teal, gold, blue, ink, muted);
      [NSGraphicsContext restoreGraphicsState];

      CMTime presentationTime = CMTimeMake(frame, kFPS);
      [adaptor appendPixelBuffer:pixelBuffer withPresentationTime:presentationTime];

      CGContextRelease(context);
      CVPixelBufferUnlockBaseAddress(pixelBuffer, 0);
      CVPixelBufferRelease(pixelBuffer);
    }
  }

  [input markAsFinished];
  dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
  [writer finishWritingWithCompletionHandler:^{
    dispatch_semaphore_signal(semaphore);
  }];
  dispatch_semaphore_wait(semaphore, DISPATCH_TIME_FOREVER);

  if (writer.status != AVAssetWriterStatusCompleted) {
    if (error) {
      *error = writer.error ?: [NSError errorWithDomain:@"ClarpointWriter" code:5 userInfo:@{NSLocalizedDescriptionKey: @"Video encoding failed."}];
    }
    return NO;
  }

  return YES;
}

static BOOL MergeVideoAndAudio(NSURL *videoURL, NSURL *audioURL, NSURL *outputURL, NSError **error) {
  [[NSFileManager defaultManager] removeItemAtURL:outputURL error:nil];

  AVURLAsset *videoAsset = [AVURLAsset URLAssetWithURL:videoURL options:nil];
  AVURLAsset *audioAsset = [AVURLAsset URLAssetWithURL:audioURL options:nil];
  AVMutableComposition *composition = [AVMutableComposition composition];

  AVMutableCompositionTrack *videoTrack = [composition addMutableTrackWithMediaType:AVMediaTypeVideo preferredTrackID:kCMPersistentTrackID_Invalid];
  AVAssetTrack *sourceVideoTrack = [[videoAsset tracksWithMediaType:AVMediaTypeVideo] firstObject];
  [videoTrack insertTimeRange:CMTimeRangeMake(kCMTimeZero, videoAsset.duration) ofTrack:sourceVideoTrack atTime:kCMTimeZero error:error];

  NSArray<AVAssetTrack *> *audioTracks = [audioAsset tracksWithMediaType:AVMediaTypeAudio];
  if (audioTracks.count > 0) {
    AVMutableCompositionTrack *audioTrack = [composition addMutableTrackWithMediaType:AVMediaTypeAudio preferredTrackID:kCMPersistentTrackID_Invalid];
    AVAssetTrack *sourceAudioTrack = audioTracks.firstObject;
    [audioTrack insertTimeRange:CMTimeRangeMake(kCMTimeZero, audioAsset.duration) ofTrack:sourceAudioTrack atTime:kCMTimeZero error:error];
  }

  AVAssetExportSession *exporter = [[AVAssetExportSession alloc] initWithAsset:composition presetName:AVAssetExportPresetHighestQuality];
  exporter.outputURL = outputURL;
  exporter.outputFileType = AVFileTypeMPEG4;
  exporter.shouldOptimizeForNetworkUse = YES;

  dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
  [exporter exportAsynchronouslyWithCompletionHandler:^{
    dispatch_semaphore_signal(semaphore);
  }];
  dispatch_semaphore_wait(semaphore, DISPATCH_TIME_FOREVER);

  if (exporter.status != AVAssetExportSessionStatusCompleted) {
    if (error) {
      *error = exporter.error ?: [NSError errorWithDomain:@"ClarpointExport" code:6 userInfo:@{NSLocalizedDescriptionKey: @"Failed to export final MP4."}];
    }
    return NO;
  }

  return YES;
}

int main(void) {
  @autoreleasepool {
    NSString *root = [NSFileManager defaultManager].currentDirectoryPath;
    NSString *directory = [root stringByAppendingPathComponent:@"admin/growth-studio"];

    ReelVariant variants[] = {
      {
        @"website-clarity-variant-1",
        @"Flo (English (US))",
        165,
        @"The offer is strong,\nbut the website\nmessage is vague\nand hard to scan.",
        @"The work is moving,\nbut nobody has\na clean view of\nwhat matters.",
        @"A strong offer can still lose people fast if the website message feels vague, cluttered, or hard to follow.",
        @"Clarpoint brings\nstructure, sharper\ncommunication,\nand a stronger\nexecution path.",
        @"Clarpoint helps turn scattered pages and mixed messaging into a cleaner story people can trust much faster.",
        @"Website and\ndigital presence\nsupport.",
        @"Cleaner positioning, sharper calls to action, and a more credible digital presence.",
        @"Get a website\nor project review.",
        @"A simple review can show what to clean up first.",
        @"You can have a strong offer and still lose people if the website message is vague. When visitors land and have to work too hard to figure out what you do, trust drops. Clarpoint helps clean up the message, sharpen the structure, and make the site feel more credible. If you want a clearer website and a stronger first impression, get a website or project review at clarpoint dot co."
      },
      {
        @"website-clarity-variant-2",
        @"Sandy (English (US))",
        162,
        @"A strong business\ncan still look unclear\nonline.",
        @"Visitors are landing,\nbut the message\nis not doing enough\nwork.",
        @"If people land on the site and still do not get the offer, the message is not doing its job.",
        @"Clarpoint sharpens\nthe message,\nstructure, and\ncustomer path.",
        @"That means cleaner hierarchy, better calls to action, and a homepage that explains the value in seconds instead of minutes.",
        @"Digital presence\nthat feels clearer\nand more credible.",
        @"Practical improvements that make the business easier to understand and easier to choose.",
        @"See what the site\nshould say next.",
        @"Get a website or project review from Clarpoint.",
        @"A strong business can still look unclear online. If visitors land on the website and still are not sure what you do, what you offer, or why they should stay, the message needs work. Clarpoint sharpens the language, the structure, and the customer path so the site feels clearer and more convincing. Get a website or project review at clarpoint dot co."
      },
      {
        @"website-clarity-variant-3",
        @"Shelley (English (US))",
        160,
        @"If the website feels\ndated, vague, or\nhard to scan,\nit is costing trust.",
        @"The business may be\nsolid, but the digital\npresence is not\nkeeping up.",
        @"Unclear messaging creates friction before the real conversation even starts, and that costs momentum.",
        @"Clarpoint helps align\nthe plan, the message,\nand the customer\nexperience.",
        @"From homepage copy to mobile clarity and stronger calls to action, the goal is a simpler path to response.",
        @"Clear plans.\nStronger communication.\nBetter execution.",
        @"That same standard should show up in the website too.",
        @"Start with a clearer\nwebsite review.",
        @"Clarpoint can help you find the right next move.",
        @"If the website feels dated, vague, or hard to scan, it is probably costing trust before the conversation even begins. Clarpoint helps improve the message, the structure, and the customer experience so the digital presence finally feels as strong as the business behind it. Start with a clearer website review at clarpoint dot co."
      }
    };

    NSInteger count = sizeof(variants) / sizeof(ReelVariant);
    NSMutableArray<NSString *> *finalPaths = [NSMutableArray array];

    for (NSInteger index = 0; index < count; index += 1) {
      ReelVariant variant = variants[index];
      NSError *error = nil;

      NSURL *audioURL = BuildAudioFile(directory, variant, &error);
      if (!audioURL) {
        fprintf(stderr, "Audio failed for %s: %s\n", variant.slug.UTF8String, error.localizedDescription.UTF8String);
        return 1;
      }

      AVURLAsset *audioAsset = [AVURLAsset URLAssetWithURL:audioURL options:nil];
      double audioSeconds = CMTimeGetSeconds(audioAsset.duration);
      double totalDuration = MAX(audioSeconds + 0.4, 12.0);

      NSURL *silentVideoURL = [NSURL fileURLWithPath:[directory stringByAppendingPathComponent:[NSString stringWithFormat:@"%@-silent.mp4", variant.slug]]];
      if (!RenderSilentVideo(silentVideoURL, variant, totalDuration, &error)) {
        fprintf(stderr, "Video failed for %s: %s\n", variant.slug.UTF8String, error.localizedDescription.UTF8String);
        return 1;
      }

      NSURL *finalURL = [NSURL fileURLWithPath:[directory stringByAppendingPathComponent:[NSString stringWithFormat:@"%@.mp4", variant.slug]]];
      if (!MergeVideoAndAudio(silentVideoURL, audioURL, finalURL, &error)) {
        fprintf(stderr, "Merge failed for %s: %s\n", variant.slug.UTF8String, error.localizedDescription.UTF8String);
        return 1;
      }

      [finalPaths addObject:finalURL.path];
    }

    for (NSString *path in finalPaths) {
      printf("%s\n", path.UTF8String);
    }
  }

  return 0;
}
