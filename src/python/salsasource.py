import numpy as np

from js import jsarray
from io import BytesIO
from astropy.io import fits
from scipy.optimize import curve_fit

clight = 299792458


class SALSASource:
    def __init__(self, bytesfile) -> None:
        self.content = fits.open(BytesIO(bytesfile), mode="readonly")

    def _single_gaussian(self, x: np.ndarray, mean: float, sigma: float, amp: float) -> np.ndarray:
        """
        Function to create a gaussian profile G(x)

        Args:
            x (np.ndarray): input x
            mean (float): mean of the gaussian
            sigma (float): standard deviation of the gaussian
            amp (float): amplitude of the gaussian

        Returns:
            np.ndarray: the profile of the function
        """
        return amp * np.exp( -(x-mean)**2 / (2*sigma**2) )

    def _gaussian_stack(self, x: np.ndarray, *params) -> np.ndarray:
        """
        Function to create multiple gaussian combination

        Args:
            x (np.ndarray): input x
            params: gaussian parameters in the order of mean, sigma, and amp

        Returns:
            np.ndarray: the profile of the function
        """
        y = np.zeros_like(x)
        for i in range(0, len(params), 3):
            mean, sigma, amp = params[i], params[i+1], params[i+2]
            y = y + self._single_gaussian(x, mean, sigma, amp)
        return y

    @property
    def header(self) -> dict:
        """
        Header of the input fits file

        Returns:
            dict: dictionary of the fits header
        """
        header = self.content[0].header
        return dict(header)

    @property
    def rawdata(self) -> list[float]:
        """
        Raw data saved in the fits file

        Returns:
            list[float]: raw data
        """
        return self.content[0].data.tolist()

    def axisdata(self, idx: int, unit: str = None) -> np.ndarray:
        """
        Get the data of one axis. Do unit conversion if needed

        Args:
            idx (int): The index of the axis
            unit (str, optional): The unit of the data. Defaults to None.

        Raises:
            RuntimeError: if the index is out of the range of the data dimension
            RuntimeError: the unit doesn't match with the target axis

        Returns:
            np.ndarray: the data of the axis
        """
        if idx > self.header.get("NAXIS"):
            raise RuntimeError(f"Input index {idx} is higher than the dimension")

        naxis = self.header[f"NAXIS{idx}"]
        reval = self.header[f"CRVAL{idx}"]
        repix = self.header[f"CRPIX{idx}"]
        delta = self.header[f"CDELT{idx}"]
        cunit = self.header[f"CTYPE{idx}"]

        vlsr = self.header["VELO-LSR"] * 1000

        if not unit:
            ret = [reval + (i - repix) * delta for i in range(naxis)]

        else:

            lowerunit = unit.lower()

            if idx == 1:
                # Channels
                if lowerunit.startswith("chan"):
                    ret = np.array(list(range(naxis)))

                elif lowerunit.startswith("freq"):
                    ret = np.array([reval + (i - repix) * delta for i in range(naxis)])

                    if lowerunit.endswith("-k"):
                        ret /= 10**3
                    elif lowerunit.endswith("-m"):
                        ret /= 10**6
                    elif lowerunit.endswith("-g"):
                        ret /= 10**9

                elif lowerunit.startswith("vel"):
                    freq = np.array([reval + (i - repix) * delta for i in range(naxis)])
                    ret = (-clight * (freq - reval) / reval - vlsr) / 1000

                else:
                    raise RuntimeError(f"{cunit} cannot be converted to {unit}")

        return ret

    def fit_baseline(
        self,
        xdata: list[float],
        ydata: list[float],
        frequnit: str = None,
        deg: float = 2,
    ) -> np.ndarray:
        """
        Fit a polynomial baseline to the input data

        Args:
            xdata (list[float]): input x (frequency axis)
            ydata (list[float]): input y
            frequnit (str, optional): the unit of frequency (x). Defaults to None.
            deg (float, optional): the order of the polynomial. Defaults to 2.

        Returns:
            np.ndarray: the baseline data (y_fit)
        """

        if not xdata or not ydata:
            return []

        # ? error: https://stackoverflow.com/questions/15721053/whats-the-error-of-numpy-polyfit
        poly = np.polyfit(xdata.to_py(), ydata.to_py(), deg=deg)
        x = self.axisdata(1, unit=frequnit)
        return np.polyval(poly, x)

    def fit_gaussian(
        self, 
        frequnit: str = None, 
        baseline: list[float] = None, 
        ngaussian: int = 0, 
        xylim: list[list[float]] = None,
    ) -> tuple[np.ndarray, list[np.ndarray], list[list[float]]]:
        """
        Fit multiple gaussian functions to the data. `xylim` is in the format of
        `[xmin, xmax, ymin, ymax]`. If `xylim` is provided, the mean, standard  
        deviation, and amplitude of the gaussian will be limited in `[xmin, xmax]`,
        `[0, 2*(xmax-xmin)]`, and `[ymin, 2*ymax]`. Otherwise, the default constraints
        are `[xmin, xmax]`, `[0, xmax-xmin]`, `[0.5*ymin, 2*ymax]`.

        Args:
            frequnit (str, optional): the unit of frequency (x). Defaults to None.
            baseline (list[float], optional): the fitted baseline. Defaults to None.
            ngaussian (int, optional): the number of gaussians to fit. Defaults to 0.
            xylim (list[list[float]], optional): limitation to the gaussians. Defaults to None.

        Returns:
            tuple[np.ndarray, list[np.ndarray], list[list[float]]]: _description_
        """

        xdata = self.axisdata(1, unit=frequnit)

        if not ngaussian:
            return np.zeros(xdata.shape), [], []

        if baseline is None:
            return np.zeros(xdata.shape), [], []

        ydata = self.content[0].data.flatten() - np.array(baseline.to_py())

        xdatarange = xdata.max() - xdata.min()

        # initial guess
        p0 = [xdata.mean(), xdatarange / 2.0, ydata.max()] * ngaussian
        # lower/upper bound for the mean, sigma, and amp of each gaussian
        lbound = [xdata.min(), 0.0, 0.5*ydata.min()] * ngaussian
        ubound = [xdata.max(), xdatarange, 2.0*ydata.max()] * ngaussian

        if xylim:
            for idx, lim in enumerate(xylim):
                xmin, xmax, ymin, ymax = lim
                if idx < ngaussian:
                    p0[idx*3:(idx+1)*3] = [(xmin+xmax)/2.0, (xmax-xmin), ymax]
                    lbound[idx*3:(idx+1)*3] = [xmin, 0.0, ymin]
                    ubound[idx*3:(idx+1)*3] = [xmax, 2.0*(xmax-xmin), 2.0*ymax]

        popt, pcov = curve_fit(self._gaussian_stack, xdata, ydata, p0=p0, bounds=(lbound, ubound))

        gaussian_params = [popt[idx*3:(idx+1)*3] for idx in range(ngaussian)]
        single_gaussians = [self._single_gaussian(xdata, *params) for params in gaussian_params]
        gaussian_stack = self._gaussian_stack(xdata, *popt)

        return gaussian_stack, single_gaussians, gaussian_params

    def convert2freq(self, value: float, unit: str) -> float:
        """
        Convert the input value from the input unit to frequency 

        Args:
            value (float): input value
            unit (str): original unit

        Raises:
            ValueError: if the input unit is unknown

        Returns:
            float: value in frequency
        """

        reval = self.header[f"CRVAL1"]
        repix = self.header[f"CRPIX1"]
        delta = self.header[f"CDELT1"]

        vlsr = self.header["VELO-LSR"] * 1000

        lowerunit = unit.lower()

        if lowerunit.startswith("chan"):
            ret = reval + (value - repix) * delta

        elif lowerunit.startswith("freq"):
            ret = value

            if lowerunit.endswith("-k"):
                ret *= 1e3
            elif lowerunit.endswith("-m"):
                ret *= 1e6
            elif lowerunit.endswith("-g"):
                ret *= 1e9

        elif lowerunit.startswith("vel"):
            ret = - (value * 1000 + vlsr) * reval / clight + reval

        else:
            raise ValueError(f"Unkown unit: {unit}")

        return ret

    def convertfreq(self, value: float, unit: str) -> float:
        """
        Convert the frequency to another unit

        Args:
            value (float): input frequency value
            unit (str): target unit

        Raises:
            ValueError: if the target unit is unknown

        Returns:
            float: target value
        """

        reval = self.header[f"CRVAL1"]
        repix = self.header[f"CRPIX1"]
        delta = self.header[f"CDELT1"]

        vlsr = self.header["VELO-LSR"] * 1000

        lowerunit = unit.lower()

        if lowerunit.startswith("chan"):
            ret = (value - reval) / delta + repix

        elif lowerunit.startswith("freq"):
            ret = value

            if lowerunit.endswith("-k"):
                ret /= 1e3
            elif lowerunit.endswith("-m"):
                ret /= 1e6
            elif lowerunit.endswith("-g"):
                ret /= 1e9

        elif lowerunit.startswith("vel"):
            ret = (-clight * (value - reval) / reval - vlsr) / 1000

        else:
            raise ValueError(f"Unkown unit: {unit}")

        return ret

array = jsarray.to_py().tobytes()
salsa = SALSASource(array)
