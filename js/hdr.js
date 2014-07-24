/*
This code is straight from https://bel.fi/alankila/hdr/hdrexperiment.html

copyright alan kila 2014



*/


function getImageArray(display, img) {
  var imageGamma = 2.0;
  var gammaCorrect = function(value) {
    return Math.pow(value / 255, imageGamma);
  }

  log("Reading image");
  var ctx = display.getContext('2d');
  ctx.fillColor = 'rgb(0, 0, 0, 255)';
  ctx.fillRect(0, 0, display.width, display.height);
  ctx.drawImage(img, 0, 0,
    Math.min(img.width, display.width),
    Math.min(img.height, display.height));
  var image = ctx.getImageData(0, 0, display.width, display.height);

  var floatImage = [];
  for (var j = 0; j < image.data.length; j += 4) {
    var r = image.data[j + 0];
    var g = image.data[j + 1];
    var b = image.data[j + 2];

    r = gammaCorrect(r);
    g = gammaCorrect(g);
    b = gammaCorrect(b);

    /* XXX implement a better noise reduction algorithm. */
    r -= 0.001;
    g -= 0.001;
    b -= 0.001;
    if (r < 0)
      r = 0;
    if (g < 0)
      g = 0;
    if (b < 0)
      b = 0;

    floatImage[j + 0] = r;
    floatImage[j + 1] = g;
    floatImage[j + 2] = b;
    floatImage[j + 3] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  return floatImage;
}

function buildHdrImage(display, imageList) {
  log("Begin HDR calculations");

  /* need some smooth, rapidly decaying function that controls blending
   * from one picture to another when nearing exposure limit on that pic */
  var toWeight = function(r) {
    r = r * r;
    r = r * r;
    return 1.001 - r;
  };

  /* initialize our end product */
  var combinedImage = [];
  for (var j = 0; j < imageList[0].length; j++) {
    combinedImage[j] = 0;
  }

  /* autocalibrate exposure pair-wise between the images by finding
   * the not overexposed areas. */
  var imageWeight = 1;
  var currentImage;
  for (var i = 1; i < imageList.length; i++) {
    var baseImage = imageList[i - 1];
    currentImage = imageList[i];
    var sum1 = 0;
    var sum2 = 0;
    log("Combining image pair " + (i - 1) + " and " + i + " at weight " + imageWeight);
    for (var j = 0; j < baseImage.length; j += 4) {
      var w1 = toWeight(Math.max(baseImage[j + 0], baseImage[j + 1], baseImage[j + 2]));
      var w2 = toWeight(Math.max(currentImage[j + 0], currentImage[j + 1], currentImage[j + 2]));
      sum1 += baseImage[j + 3] * w1 * w2;
      sum2 += currentImage[j + 3] * w1 * w2;

      combinedImage[j + 0] += baseImage[j + 0] * w1 * imageWeight;
      combinedImage[j + 1] += baseImage[j + 1] * w1 * imageWeight;
      combinedImage[j + 2] += baseImage[j + 2] * w1 * imageWeight;
      combinedImage[j + 3] += w1 * imageWeight;
    }

    /* calibrate exposure difference for next round */
    imageWeight *= sum1 / sum2;
  }

  log("And the final pair at weight: " + imageWeight);
  for (var j = 0; j < currentImage.length; j += 4) {
    var w2 = toWeight(Math.max(currentImage[j + 0], currentImage[j + 1], currentImage[j + 2]));
    combinedImage[j + 0] += currentImage[j + 0] * w2 * imageWeight;
    combinedImage[j + 1] += currentImage[j + 1] * w2 * imageWeight;
    combinedImage[j + 2] += currentImage[j + 2] * w2 * imageWeight;
    combinedImage[j + 3] += w2 * imageWeight;

    var w = combinedImage[j + 3];
    combinedImage[j + 0] /= w;
    combinedImage[j + 1] /= w;
    combinedImage[j + 2] /= w;
    combinedImage[j + 3] = 0.299 * combinedImage[j + 0] + 0.587 * combinedImage[j + 1] + 0.114 * combinedImage[j + 2];
  }

  return combinedImage;
}

function exposureApplier(display, bottom, top, image) {
  var adjust = function(r) {
    if (r < bottom)
      return 0;
    if (r > top)
      return 1;
    return (r - bottom) / (top - bottom);
  }

  var displayGamma = 2.0;
  var deGammaCorrect = function(value) {
    return Math.round(Math.pow(value, 1 / displayGamma) * 255);
  }


  var img = display.getContext('2d').getImageData(0, 0, display.width, display.height);
  for (var j = 0; j < image.length; j += 4) {
    var r = image[j + 0];
    var g = image[j + 1];
    var b = image[j + 2];
    img.data[j + 0] = deGammaCorrect(adjust(r));
    img.data[j + 1] = deGammaCorrect(adjust(g));
    img.data[j + 2] = deGammaCorrect(adjust(b));
    img.data[j + 3] = 255;
  }

  return img;
}

function toneMapGlobal(display, image, a) {
  log("Begin Reinhard global tone mapping");

  var averageLuminance = a / estimateAverageLuminance(image);
  var newImage = [];
  for (var j = 0; j < image.length; j += 4) {
    var avg = image[j + 3] * averageLuminance;
    avg /= 1 + avg;
    newImage[j + 0] = image[j + 0] / image[j + 3] * avg;
    newImage[j + 1] = image[j + 1] / image[j + 3] * avg;
    newImage[j + 2] = image[j + 2] / image[j + 3] * avg;
    newImage[j + 3] = 0;
  }

  return newImage;
}

function toneMapLocal(display, image, key, sharpening) {
  log("Begin Reinhard local tone mapping");

  var blurred = [];
  /* build the maps for Reinhard local operator */
  var onePixelGaussian = 1 / (2 * Math.sqrt(2));
  for (var i = 0; i < sharpening; i++) {
    /* gaussian blur optimization: reuse the earlier blur to 
     * save processing time. Combination of gaussian blurs:
     * r = Math.sqrt(r1^2 + r2^2). Thus it follows that if we have
     * blurred image at radius r1 and we want to generate blurred image at
     * radius r, we must blur by r2, that is: Math.sqrt(r^2 - r1^2).
     */
    if (i == 0) {
      var blurbase = [];
      for (var j = 0; j < image.length; j += 4) {
        blurbase[j / 4] = image[j + 3];
      }
      var gaussian = gaussianKernelHalf(onePixelGaussian);
      var blurred0 = gaussianBlur(display, blurbase, gaussian);
      blurred.push(blurred0);
    } else {
      var r1 = Math.pow(1.6, i - 1) * onePixelGaussian;
      var r = Math.pow(1.6, i) * onePixelGaussian;
      var r2 = Math.sqrt(r * r - r1 * r1);
      var gaussian = gaussianKernelHalf(r2);
      var blurredI = gaussianBlur(display, blurred[i - 1], gaussian);
      blurred.push(blurredI);
    }
  }

  /* now select the right map for each pixel */
  var localEnvironment = [];
  var epsilon = 0.001;
  var scaler = Math.pow(2, sharpening) * key;
  for (var i = 0; i < blurred[0].length; i++) {
    var j;
    for (j = 0; j < blurred.length - 1; j++) {
      var v = blurred[j][i] - blurred[j + 1][i];
      v /= scaler / Math.pow(1.6, j * 2) + blurred[j][i];
      if (v > epsilon || v < -epsilon) {
        break;
      }
    }

    localEnvironment[i] = blurred[j][i];
  }

  var averageLuminance = 1 / estimateAverageLuminance(image);
  var newImage = [];
  for (var j = 0; j < image.length; j += 4) {
    avg = averageLuminance / (1 + localEnvironment[j / 4] * averageLuminance);
    newImage[j + 0] = image[j + 0] * avg;
    newImage[j + 1] = image[j + 1] * avg;
    newImage[j + 2] = image[j + 2] * avg;
    newImage[j + 3] = 0;
  }

  return newImage;
}

function toneMapFattal(display, image, alpha, beta) {
  var buildMipmaps = function(width, height, logLuminances, pieceSize) {
    var mipmap = [logLuminances];
    var i = 1;
    while (true) {
      width >>= 1;
      height >>= 1;
      /* if this layer will be too small, break iteration.
       * Fattal's paper suggests at least 32 pixels in the
       * longer direction. */
      if (Math.max(width, height) < pieceSize) {
        break;
      }

      var source = mipmap[i - 1];
      var target = [];
      var jTarget = 0;
      for (var y = 0; y < height; y++) {
        var jSource = y * 2 * (width * 2);
        for (var x = 0; x < width; x++) {
          target[jTarget++] =
            (source[jSource] + source[jSource + 1] + source[jSource + width * 2] + source[jSource + 1 + width * 2]) * 0.25;
          jSource += 2;
        }
      }
      mipmap.push(target);

      i++;
    }

    return mipmap;
  };

  function buildGradientPyramid(width, height, mipmaps) {
    var scale = 0.5;

    var avg = [];
    var gradients = [];
    for (var i = 0; i < mipmaps.length; i++) {
      var mipmap = mipmaps[i];
      var gradMap = [];
      gradMap.avg = 0;
      var j = 0;
      for (var y = 0; y < height; y++) {
        var n = y == 0 ? 0 : -width;
        var s = y == height - 1 ? 0 : width;
        for (var x = 0; x < width; x++) {
          var w = x == 0 ? 0 : -1;
          var e = x == width - 1 ? 0 : 1;

          var gx = (mipmap[j + w] - mipmap[j + e]);
          var gy = (mipmap[j + s] - mipmap[j + n]);
          var g = Math.sqrt(gx * gx + gy * gy) * scale + 1e-6;

          gradMap[j] = g
          gradMap.avg += g;
          j++;
        }
      }
      gradMap.avg /= width * height;
      gradients.push(gradMap);

      width >>= 1;
      height >>= 1;
      scale /= 2;
    }

    return gradients;
  };

  /* actually, we don't suppress gradients, we convert the gradient data
   * to suppression map, and start again from logLuminance. */
  var suppressGradients = function(width, height, gradients, alpha, beta) {
    beta -= 1;
    for (var k = 0; k < gradients.length; k++) {
      var gradient = gradients[k];
      var alphaAvg = 1 / (alpha * gradient.avg);
      var j = 0;
      for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
          gradient[j] = Math.pow(gradient[j] * alphaAvg, beta);
          j++;
        }
      }
      width >>= 1;
      height >>= 1;
    }
  };

  var flattenGradientPyramid = function(width, height, gradients) {
    var output = [];
    var j = 0;

    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {

        /* sums all levels together with linear interpolation.
         * the gradients are already scaled, and thus can be
         * summed as they are. */

        var suby = y;
        var subx = x;
        var subwidth = width;
        var subheight = height;

        var value = 1.0;
        for (var k = 0; k < gradients.length; k++) {
          var gradient = gradients[k];

          var floorx = Math.floor(subx);
          var floory = Math.floor(suby);

          /* obtain interpolated array values */
          var thisPixel = floorx + floory * subwidth;
          var thisValue = gradient[thisPixel];
          var nextValue = floorx != subwidth - 1 ? gradient[thisPixel + 1] : thisValue;
          var downValue = floory != subheight - 1 ? gradient[thisPixel + subwidth] : thisValue;
          var downNextValue = floorx != subwidth - 1 && floory != subheight - 1 ? gradient[thisPixel + 1 + subwidth] : thisValue;

          /* interpolation is treated as adjustment in both x and y
           * direction over the gradient established by comparing
           * the deltas toward right and down. */
          var topRow = thisValue + (nextValue - thisValue) * (subx - floorx);
          var bottomRow = downValue + (downNextValue - downValue) * (subx - floorx);
          value *= topRow + (bottomRow - topRow) * (suby - floory);

          suby /= 2;
          subx /= 2;
          subwidth >>= 1;
          subheight >>= 1;
        }

        output[j++] = value;
      }
    }
    return output;
  };

  var buildDivField = function(width, height, logLuminances, fiMatrix) {
    var div = [];

    /* gradients outside image are 0 */
    var prevGy = [];
    for (var x = 0; x < width; x++) {
      prevGy[x] = 0;
    }

    var j = 0;
    for (var y = 0; y < height; y++) {
      var prevGx = 0;
      for (var x = 0; x < width; x++) {
        var e = x == width - 1 ? j : j + 1;
        var s = y == height - 1 ? j : j + width;
        var gx = (logLuminances[e] - logLuminances[j]) * fiMatrix[j];
        var gy = (logLuminances[s] - logLuminances[j]) * fiMatrix[j];
        div[j] = gx - prevGx + gy - prevGy[x];
        prevGx = gx;
        prevGy[x] = gy;
        j++;
      }
    }

    return div;
  };

  /* multigrid solver */
  var solve = function(width, height, div) {
    var levels = Math.round(Math.log(Math.max(width, height)) / Math.log(2) - Math.log(8) / Math.log(2));

    var approximations = [
      []
    ];
    var targets = [div];
    for (var j = 1; j < levels; j++) {
      targets[j] = [];
      approximations[j] = [];
    }

    for (var j = 0; j < width * height; j++) {
      /* preinit & save a gauss step */
      approximations[0][j] = -div[j] * 0.25;
    }

    /* it is much more important to run the multigridding several times
     * than to spend time trying to improve the solution at each level of
     * iteration. Gauss converges slowly, as only neighboring pixels
     * interact. */
    var iterPerStep = 2;
    for (var l = 0; l < 20; l++) {
      for (var k = 0; k < levels - 1; k++) {
        var approximation = approximations[k];
        var target = targets[k];
        var levelWidth = width >> k;
        var levelHeight = height >> k;

        var lowerLevelWidth = width >> (k + 1);
        var lowerLevelHeight = height >> (k + 1);
        var nextTarget = targets[k + 1];
        var nextApproximation = approximations[k + 1];

        /* pre-smooth */
        solveGauss(levelWidth, levelHeight, approximation, target, iterPerStep - 1);

        /* restrict */
        for (var y = 0; y < lowerLevelHeight; y += 1) {
          var jLower = y * lowerLevelWidth;
          var jHigher = y * levelWidth * 2;
          for (var x = 0; x < lowerLevelWidth; x += 1) {
            nextTarget[jLower] = approximation[jHigher] + approximation[jHigher + 1] + approximation[jHigher + levelWidth] + approximation[jHigher + 1 + levelWidth];

            jLower += 1;
            jHigher += 2;
          }
        }

        /* defect = 4x the difference at this iteration and the previous.
         * in reality we are measuring the defect against the previous
         * set of values at approximation, though, thus the defect which
         * we derive is too large when we apply it back. But in practice
         * it seems to work. Let's hope it converges each time. */
        solveGauss(levelWidth, levelHeight, approximation, target, 1);

        for (var y = 0; y < lowerLevelHeight; y += 1) {
          var jLower = y * lowerLevelWidth;
          var jHigher = y * levelWidth * 2;
          for (var x = 0; x < lowerLevelWidth; x += 1) {
            nextTarget[jLower] -= approximation[jHigher] + approximation[jHigher + 1] + approximation[jHigher + levelWidth] + approximation[jHigher + 1 + levelWidth];
            /* preinit & save a gauss step */
            nextApproximation[jLower] = -nextTarget[jLower] * 0.25;
            jLower += 1;
            jHigher += 2;
          }
        }
      }

      /* solve at lowest level */
      solveGauss(width >> k, height >> k, approximations[k], targets[k], iterPerStep);

      for (var k = levels - 1; k >= 1; k--) {
        var approximation = approximations[k];
        var levelWidth = width >> k;
        var levelHeight = height >> k;

        var higherLevelWidth = width >> (k - 1);
        var higherLevelHeight = height >> (k - 1);
        var prevApproximation = approximations[k - 1];
        var prevTarget = targets[k - 1];

        /* prolongate */
        for (var y = 0; y < levelHeight; y++) {
          var jLower = y * levelWidth;
          var jHigher = y * 2 * higherLevelWidth;
          for (var x = 0; x < levelWidth; x++) {
            var update = approximation[jLower];
            prevApproximation[jHigher] += update;
            prevApproximation[jHigher + 1] += update;
            prevApproximation[jHigher + higherLevelWidth] += update;
            prevApproximation[jHigher + 1 + higherLevelWidth] += update;

            jLower += 1;
            jHigher += 2;
          }
        }

        /* post-smooth */
        solveGauss(higherLevelWidth, higherLevelHeight, prevApproximation, prevTarget, iterPerStep);
      }
    }

    return approximations[0];
  };

  /* elements outside image are 0. */
  function solveGauss(width, height, approximation, grid, maxiter) {
    for (var l = 0; l < maxiter; l++) {
      for (var redBlack = 0; redBlack < 2; redBlack++) {
        var xinit = redBlack;
        for (var y = 0; y < height; y++) {
          var idx = y * width + xinit;
          var idxWidth = y * width + width - 1;

          /* deal with top/bottom rows. */
          if (y == 0 || y == height - 1) {
            var rowOffset = y == 0 ? width : -width;
            /* left corner pixel */
            if (xinit == 0) {
              var defect = approximation[idx + 1] + approximation[idx + rowOffset] - 4 * approximation[idx] - grid[idx];
              approximation[idx] += defect * 0.25;
              idx += 2;
            }
            /* top/bottom edge pixel */
            for (; idx < idxWidth; idx += 2) {
              var defect = approximation[idx + 1] + approximation[idx - 1] + approximation[idx + rowOffset] - 4 * approximation[idx] - grid[idx];
              approximation[idx] += defect * 0.25;
            }
            /* right corner pixel */
            if (idx == idxWidth) {
              var defect = approximation[idx - 1] + approximation[idx + rowOffset] - 4 * approximation[idx] - grid[idx];
              approximation[idx] += defect * 0.25;
            }
          } else {
            /* left edge pixel */
            if (xinit == 0) {
              var defect = approximation[idx + 1] + approximation[idx + width] + approximation[idx - width] - 4 * approximation[idx] - grid[idx];
              approximation[idx] += defect * 0.25;
              idx += 2;
            }
            /* surrounded pixel */
            for (; idx < idxWidth; idx += 2) {
              var defect = approximation[idx + 1] + approximation[idx - 1] + approximation[idx + width] + approximation[idx - width] - 4 * approximation[idx] - grid[idx];
              approximation[idx] += defect * 0.25;
            }
            /* right edge pixel */
            if (idx == idxWidth) {
              var defect = approximation[idx - 1] + approximation[idx + width] + approximation[idx - width] - 4 * approximation[idx] - grid[idx];
              approximation[idx] += defect * 0.25;
            }
          }

          xinit = 1 - xinit;
        }
      }
    }
  };

  log("Begin Fattal tone mapping");
  /* Fattal's paper says he works entirely in the log(luminance) field,
   * but since I experience some artifacts around strong contrasts if I
   * don't at least filter & scale the source image in the physically linear
   * field, I'm going to do this part my way. */
  var logLuminances = [];
  for (var j = 0; j < image.length; j += 4) {
    logLuminances[j / 4] = image[j + 3];
  }
  var mipmaps = buildMipmaps(display.width, display.height, logLuminances, 32);
  /* now turn the mipmaps & logLuminances itself to log.
   * logLuminances is mipmaps[0] */
  for (var i = 0; i < mipmaps.length; i++) {
    for (var j = 0; j < mipmaps[i].length; j++) {
      mipmaps[i][j] = Math.log(mipmaps[i][j] + 1e-4);
    }
  }

  log("Calculating image gradients at various levels of scale.");
  var gradients = buildGradientPyramid(display.width, display.height, mipmaps);
  log("Suppressing gradients according to alpha/beta.");
  suppressGradients(display.width, display.height, gradients, alpha, beta);
  log("Flattening gradient suppression map.");
  var gradient = flattenGradientPyramid(display.width, display.height, gradients);
  log("Calculating divergence field.");
  var div = buildDivField(display.width, display.height, logLuminances, gradient);
  log("Solving Poisson equation.");
  var solved = solve(display.width, display.height, div);

  log("Calibrating display.");
  for (var j = 0; j < solved.length; j++) {
    solved[j] = Math.exp(solved[j]);
  }

  /* select 1000 random pixels and calibrate brightness according to them */
  var brightness = [];
  var interv = Math.floor(solved.length/1019)//oooh 1019 is prime
  for( var j=0; j<solved.length; j+=interv){
    brightness.push( solved[j])
  }
  /*for (var j = 0; j < 2000; j++) {
    brightness.push(solved[Math.floor(solved.length * Math.random())]);
  }
  */
  brightness.sort();
  /* calibrate for visibility of 99 % of luminances */
  var min = brightness[Math.floor(brightness.length * 0.005)];
  var max = brightness[Math.floor(brightness.length * 0.995)];
  max -= min;

  /* return to normal color */
  log("Applying modified luminance map.");
  var newImage = [];
  for (var j = 0; j < image.length; j += 4) {
    var lum = (solved[j / 4] - min) / max / image[j + 3];
    newImage[j + 0] = image[j + 0] * lum;
    newImage[j + 1] = image[j + 1] * lum;
    newImage[j + 2] = image[j + 2] * lum;
    newImage[j + 3] = 0;
  }
  return newImage;
}

function gaussianKernelHalf(delta) {
  var scale = 1 / Math.sqrt(2 * Math.PI) / delta;
  /* calculate gaussian kernel */
  var gaussian = [];
  var gaussianSum = 0;
  for (var i = 0; i < 3 * delta; i++) {
    gaussian[i] = Math.exp(-i * i / (2 * delta * delta)) * scale;
    gaussianSum += gaussian[i];
    if (i != 0) {
      gaussianSum += gaussian[i];
    }
  }
  /* correct integral to 1 despite imperfect sampling */
  for (var i = 0; i < gaussian.length; i++) {
    gaussian[i] /= gaussianSum;
  }
  return gaussian;
}

function estimateAverageLuminance(image) {
  /* calculate global average illumination */
  var sum = 0;
  for (var j = 0; j < image.length; j += 4) {
    sum += Math.log(0.0001 + image[j + 3]);
  }
  return Math.exp(sum / (image.length / 4) - 0.0001);
}

function gaussianBlur(display, image, gaussian) {
  log("Gaussian blur with kernel length " + gaussian.length);
  var blurred = [];
  var buffer = [];
  var j = 0;
  /* convolve image with gaussian: x direction */
  for (var y = 0; y < display.height; y++) {
    for (var x = 0; x < display.width; x++) {
      var value = gaussian[0] * image[j];
      for (var z = 1; z < gaussian.length; z++) {
        if (x >= z) {
          value += gaussian[z] * image[j - z];
        }
        if (x < display.width - z) {
          value += gaussian[z] * image[j + z];
        }
      }
      blurred[j] = value;
      j++;
    }
  }

  /* y direction */
  for (var x = 0; x < display.width; x++) {
    for (var y = 0; y < display.height; y++) {
      buffer[y] = blurred[x + y * display.width];
    }
    for (var y = 0; y < display.height; y++) {
      var value = gaussian[0] * buffer[y];
      for (var z = 1; z < gaussian.length; z++) {
        if (y >= z) {
          value += gaussian[z] * buffer[y - z];
        }
        if (y < display.height - z) {
          value += gaussian[z] * buffer[y + z];
        }
      }
      blurred[x + y * display.width] = value;
    }
  }

  return blurred;
}