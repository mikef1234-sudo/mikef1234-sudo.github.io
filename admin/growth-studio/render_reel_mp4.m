#import <Foundation/Foundation.h>
#import <AppKit/AppKit.h>
#import <AVFoundation/AVFoundation.h>
#import <CoreGraphics/CoreGraphics.h>
#import <CoreMedia/CoreMedia.h>
#import <CoreVideo/CoreVideo.h>

static const int kWidth = 1080;
static const int kHeight = 1920;
static const int kFPS = 30;
static const int kDurationSeconds = 16;

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

  CGFloat pulse = (CGFloat)(sin(time * 2.4) * 0.5 + 0.5);
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
  DrawText(@"Website and digital presence support", CGRectMake(84, 124, 420, 28), [NSFont systemFontOfSize:24 weight:NSFontWeightBold], ink, 28);
}

static void DrawBottomCaption(CGContextRef context, NSString *label, NSString *copy, NSColor *ink) {
  DrawRoundedRect(context, CGRectMake(78, 1560, 924, 236), 30, [ink colorWithAlphaComponent:0.92]);
  DrawText([label uppercaseString], CGRectMake(126, 1604, 180, 26), [NSFont systemFontOfSize:24 weight:NSFontWeightHeavy], [NSColor colorWithCalibratedRed:127 / 255.0 green:224 / 255.0 blue:213 / 255.0 alpha:1], 26);
  DrawText(copy, CGRectMake(126, 1652, 826, 120), [NSFont systemFontOfSize:34 weight:NSFontWeightBold], NSColor.whiteColor, 44);
}

static void DrawHeadline(CGContextRef context, NSString *text, CGFloat progress, NSColor *ink) {
  CGFloat top = 300 + EaseOut(progress) * 12;
  DrawText(text, CGRectMake(82, top, 910, 620), [NSFont systemFontOfSize:78 weight:NSFontWeightHeavy], ink, 88);
}

static void DrawHook(CGContextRef context, CGFloat progress, NSColor *ink) {
  DrawHeadline(context, @"The offer is strong,\nbut the website\nmessage is vague\nand hard to scan.", progress, ink);
  DrawBottomCaption(context, @"Hook", @"A strong offer still needs a message people can understand quickly.", ink);
}

static void DrawMessyScene(CGContextRef context, CGFloat progress, double time, NSColor *ink) {
  DrawHeadline(context, @"The work is moving,\nbut nobody has\na clean view of\nwhat matters.", progress, ink);

  CGFloat pulse = (CGFloat)(sin(time * 2.4) * 0.5 + 0.5);
  CGFloat cardY = 840;
  NSArray<NSString *> *titles = @[@"Open tabs", @"Messy notes", @"Mixed signals"];
  NSArray<NSNumber *> *lineWidths = @[@228, @188, @150, @210];

  for (NSInteger index = 0; index < 3; index += 1) {
    CGFloat x = 90 + index * 320 + sin((progress + index) * 3) * 8;
    CGFloat y = cardY + (index % 2 == 0 ? 0 : 42) + pulse * 8;
    DrawRoundedRect(context, CGRectMake(x, y, 280, 220), 20, [NSColor colorWithWhite:1 alpha:0.88]);
    DrawText(titles[index], CGRectMake(x + 26, y + 24, 220, 28), [NSFont systemFontOfSize:24 weight:NSFontWeightHeavy], ink, 28);

    for (NSInteger line = 0; line < lineWidths.count; line += 1) {
      CGFloat width = lineWidths[line].doubleValue;
      DrawRoundedRect(context, CGRectMake(x + 26, y + 74 + line * 30, width, 14), 7, [ink colorWithAlphaComponent:0.11]);
    }
  }

  DrawBottomCaption(context, @"Scene 1", @"Show messy updates, open tabs, or unclear notes while the voiceover says, “The work is moving, but nobody has a clean view of what matters.”", ink);
}

static void DrawCalmScene(CGContextRef context, CGFloat progress, double time, NSColor *ink, NSColor *muted, NSColor *teal, NSColor *gold, NSColor *blue) {
  DrawHeadline(context, @"Clarpoint brings\nstructure, sharper\ncommunication,\nand a stronger\nexecution path.", progress, ink);
  DrawRoundedRect(context, CGRectMake(108, 900, 864, 560), 30, [NSColor colorWithWhite:1 alpha:0.92]);
  DrawText(@"Clarity roadmap", CGRectMake(156, 938, 280, 34), [NSFont systemFontOfSize:34 weight:NSFontWeightHeavy], ink, 38);

  CGFloat pulse = (CGFloat)(sin(time * 2.4) * 0.5 + 0.5);
  NSArray *items = @[
    @{@"label": @"Plan", @"color": teal, @"width": @0.82},
    @{@"label": @"Message", @"color": gold, @"width": @0.72},
    @{@"label": @"Launch", @"color": blue, @"width": @0.76}
  ];

  [items enumerateObjectsUsingBlock:^(NSDictionary *item, NSUInteger index, BOOL *stop) {
    CGFloat y = 1050 + index * 126;
    DrawText(item[@"label"], CGRectMake(156, y - 10, 120, 30), [NSFont systemFontOfSize:30 weight:NSFontWeightBold], muted, 34);
    DrawRoundedRect(context, CGRectMake(310, y - 16, 560, 28), 14, [ink colorWithAlphaComponent:0.09]);
    CGFloat fillWidth = 560 * ([item[@"width"] doubleValue] + pulse * 0.03);
    DrawRoundedRect(context, CGRectMake(310, y - 16, fillWidth, 28), 14, item[@"color"]);
  }];

  DrawBottomCaption(context, @"Scene 2", @"Shift to a calmer screen, roadmap, or cleaner homepage while the voiceover says, “Clarpoint brings structure, sharper communication, and a stronger execution path.”", ink);
}

static void DrawOfferScene(CGContextRef context, CGFloat progress, NSColor *ink, NSColor *muted, NSColor *teal) {
  DrawHeadline(context, @"Website and\ndigital presence\nsupport.", progress, ink);
  DrawRoundedRect(context, CGRectMake(92, 980, 896, 330), 30, [NSColor colorWithWhite:1 alpha:0.90]);
  DrawText(@"Outcome", CGRectMake(140, 1022, 140, 26), [NSFont systemFontOfSize:26 weight:NSFontWeightHeavy], teal, 30);
  DrawText(@"Clear plans. Stronger\ncommunication. Better\nexecution.", CGRectMake(140, 1082, 760, 210), [NSFont systemFontOfSize:62 weight:NSFontWeightHeavy], ink, 72);
  DrawText(@"Cleaner positioning, sharper calls to action, and a more credible digital presence.", CGRectMake(140, 1298, 760, 90), [NSFont systemFontOfSize:30 weight:NSFontWeightBold], muted, 40);
  DrawBottomCaption(context, @"Scene 3", @"Highlight website and digital presence support and the outcome: “Clear plans. Stronger communication. Better execution.”", ink);
}

static void DrawClose(CGContextRef context, CGFloat progress, NSColor *ink, NSColor *muted, NSColor *teal) {
  DrawText(@"CLARPOINT", CGRectMake(50, 1280, 980, 180), [NSFont systemFontOfSize:170 weight:NSFontWeightHeavy], [ink colorWithAlphaComponent:0.08], 180);
  DrawHeadline(context, @"Get a website\nor project review.", progress, ink);
  DrawRoundedRect(context, CGRectMake(88, 1030, 484, 80), 40, teal);
  DrawText(@"https://clarpoint.co/", CGRectMake(118, 1052, 380, 34), [NSFont systemFontOfSize:34 weight:NSFontWeightHeavy], NSColor.whiteColor, 36);
  DrawText(@"Use this as the final CTA frame for the reel close.", CGRectMake(90, 1184, 660, 80), [NSFont systemFontOfSize:34 weight:NSFontWeightBold], muted, 44);
  DrawBottomCaption(context, @"Close", @"On-screen CTA: Get a website or project review | https://clarpoint.co/", ink);
}

static void RenderScene(CGContextRef context, double time, NSColor *paper, NSColor *teal, NSColor *gold, NSColor *blue, NSColor *ink, NSColor *muted) {
  DrawBackground(context, time, paper, teal, gold, blue, ink);

  if (time < 4.2) {
    DrawHook(context, (CGFloat)(time / 4.2), ink);
  } else if (time < 8.6) {
    DrawMessyScene(context, (CGFloat)((time - 4.2) / 4.4), time, ink);
  } else if (time < 12.6) {
    DrawCalmScene(context, (CGFloat)((time - 8.6) / 4.0), time, ink, muted, teal, gold, blue);
  } else if (time < 14.5) {
    DrawOfferScene(context, (CGFloat)((time - 12.6) / 1.9), ink, muted, teal);
  } else {
    DrawClose(context, (CGFloat)((time - 14.5) / 1.5), ink, muted, teal);
  }
}

int main(void) {
  @autoreleasepool {
    NSURL *outputURL = [NSURL fileURLWithPath:[[[NSFileManager defaultManager] currentDirectoryPath] stringByAppendingPathComponent:@"admin/growth-studio/clarpoint-website-clarity-reel.mp4"]];
    [[NSFileManager defaultManager] removeItemAtURL:outputURL error:nil];

    NSError *error = nil;
    AVAssetWriter *writer = [[AVAssetWriter alloc] initWithURL:outputURL fileType:AVFileTypeMPEG4 error:&error];
    if (!writer) {
      fprintf(stderr, "Writer error: %s\n", error.localizedDescription.UTF8String);
      return 1;
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
      (NSString *)kCVPixelBufferPixelFormatTypeKey: @(kCVPixelFormatType_32ARGB),
      (NSString *)kCVPixelBufferWidthKey: @(kWidth),
      (NSString *)kCVPixelBufferHeightKey: @(kHeight),
      (NSString *)kCVPixelBufferCGImageCompatibilityKey: @YES,
      (NSString *)kCVPixelBufferCGBitmapContextCompatibilityKey: @YES
    };

    AVAssetWriterInputPixelBufferAdaptor *adaptor = [[AVAssetWriterInputPixelBufferAdaptor alloc] initWithAssetWriterInput:input sourcePixelBufferAttributes:attributes];

    if ([writer canAddInput:input]) {
      [writer addInput:input];
    } else {
      fprintf(stderr, "Unable to add writer input.\n");
      return 1;
    }

    [writer startWriting];
    [writer startSessionAtSourceTime:kCMTimeZero];

    NSColor *paper = [NSColor colorWithCalibratedRed:247 / 255.0 green:246 / 255.0 blue:239 / 255.0 alpha:1];
    NSColor *teal = [NSColor colorWithCalibratedRed:15 / 255.0 green:118 / 255.0 blue:110 / 255.0 alpha:1];
    NSColor *gold = [NSColor colorWithCalibratedRed:197 / 255.0 green:140 / 255.0 blue:16 / 255.0 alpha:1];
    NSColor *blue = [NSColor colorWithCalibratedRed:33 / 255.0 green:88 / 255.0 blue:216 / 255.0 alpha:1];
    NSColor *ink = [NSColor colorWithCalibratedRed:20 / 255.0 green:34 / 255.0 blue:32 / 255.0 alpha:1];
    NSColor *muted = [NSColor colorWithCalibratedRed:57 / 255.0 green:81 / 255.0 blue:76 / 255.0 alpha:1];

    int totalFrames = kFPS * kDurationSeconds;
    for (int frame = 0; frame < totalFrames; frame += 1) {
      while (!input.readyForMoreMediaData) {
        [NSThread sleepForTimeInterval:0.01];
      }

      @autoreleasepool {
        CVPixelBufferRef pixelBuffer = NULL;
        size_t bytesPerRow = kWidth * 4;
        void *rawBytes = calloc(kHeight, bytesPerRow);
        NSDictionary *bufferAttributes = @{
          (NSString *)kCVPixelBufferCGImageCompatibilityKey: @YES,
          (NSString *)kCVPixelBufferCGBitmapContextCompatibilityKey: @YES,
          (NSString *)kCVPixelBufferIOSurfacePropertiesKey: @{}
        };
        CVReturn status = CVPixelBufferCreateWithBytes(
          kCFAllocatorDefault,
          kWidth,
          kHeight,
          kCVPixelFormatType_32BGRA,
          rawBytes,
          bytesPerRow,
          ReleasePixelBufferMemory,
          NULL,
          (__bridge CFDictionaryRef)bufferAttributes,
          &pixelBuffer
        );
        if (status != kCVReturnSuccess || pixelBuffer == NULL) {
          fprintf(stderr, "Failed to create pixel buffer. status=%d\n", status);
          free(rawBytes);
          exit(1);
        }

        CVPixelBufferLockBaseAddress(pixelBuffer, 0);
        void *baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer);
        size_t bufferBytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer);

        CGContextRef context = CGBitmapContextCreate(baseAddress, kWidth, kHeight, 8, bufferBytesPerRow, CGColorSpaceCreateDeviceRGB(), kCGImageAlphaPremultipliedFirst | kCGBitmapByteOrder32Little);
        if (!context) {
          fprintf(stderr, "Failed to create bitmap context.\n");
          exit(1);
        }

        CGContextTranslateCTM(context, 0, kHeight);
        CGContextScaleCTM(context, 1.0, -1.0);

        NSGraphicsContext *graphicsContext = [NSGraphicsContext graphicsContextWithCGContext:context flipped:YES];
        [NSGraphicsContext saveGraphicsState];
        [NSGraphicsContext setCurrentContext:graphicsContext];
        RenderScene(context, (double)frame / (double)kFPS, paper, teal, gold, blue, ink, muted);
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

    if (writer.status == AVAssetWriterStatusCompleted) {
      printf("%s\n", outputURL.path.UTF8String);
      return 0;
    }

    fprintf(stderr, "Writer failed: %s\n", writer.error.localizedDescription.UTF8String);
    return 1;
  }
}
