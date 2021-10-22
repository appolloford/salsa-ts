import numpy as np

from io import BytesIO
from js import jsarray
from astropy.io import fits

clight = 299792458


class FitsReader:
    def __init__(self, bytesfile) -> None:
        self.content = fits.open(BytesIO(bytesfile), mode="readonly")

    @property
    def header(self) -> dict:
        header = self.content[0].header
        return dict(header)

    @property
    def rawdata(self) -> list:
        return self.content[0].data.tolist()

    def axisdata(self, idx: int, unit: str = None, order: int = 0) -> list:
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
            if idx == 1:
                # Channels
                if unit.lower().startswith("chan"):
                    ret = list(range(naxis))

                elif unit.lower().startswith("freq"):
                    ret = [reval + (i - repix) * delta for i in range(naxis)]

                elif unit.lower().startswith("vel"):
                    freq = np.array([reval + (i - repix) * delta for i in range(naxis)])
                    ret = (-clight * (freq - reval) / reval - vlsr) / 1000

                else:
                    raise RuntimeError(f"{cunit} cannot be converted to {unit}")

        return np.array(ret) / 10**order


# if __name__ == "__main__":
#     array = jsarray.to_py().tobytes()
#     print("in main", array)
#     fitsreader = FitsReader(array)
#     FitsReader(array)

array = jsarray.to_py().tobytes()
fitsreader = FitsReader(array)
# FitsReader(array)
