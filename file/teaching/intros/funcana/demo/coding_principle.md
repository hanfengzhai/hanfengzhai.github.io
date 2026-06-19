Shorten the code and refactor for a clearer logic -- pay attention to:

### Coding principle: Less is More. ### (the shorter the better)

> ALWAYS make the sure the output of the refactored code should be EXACTLY the same as before. <

* shorten the imports too -- e.g., ```import torch, os, sys, numpy as np```
* if there are any math symbols involved, e.g., units like $m^3$, or just $K$, always use r"$$" in LaTeX in matplotlib.
* minimize comments -- only put some when it is necessary for instructions.
* refactor into a class (you may use @staticmethod, @classmethod, or other methods for a clearer logistics); make sure there are line changes separating different `def()`.
* use tqdm if you can -- please pay attention for printout (use `tqdm.write()` instead of `print()` within the tqdm bar).
* make sure no empty line starts with empty blocks -- `             `.
* make sure the plotting parameters are correct (if there are any plotting involved):
    ```
    global plotting_params
    plotting_params = {"font.family": "serif", "font.serif": ["Libertinus Serif"],
                       "mathtext.fontset": "cm", "xtick.labelsize": 15, "ytick.labelsize": 15,
                       "axes.labelsize": 15, "legend.fontsize": 15}
    ```
* all "fontsize = 15" in plotting.
* try to avoid line changes in argparse.
* please avoid doing:
    ```
    def main():
        ... codes ...

    if __name__ == __main__:
        main()
    ```
    just do:
    ```
    if __name__ == __main__:
        ... codes ...
    ```
    instead.
    (one major reason I want to do this is because I like to run code with `python3 -i *.py` so I can inspect the variables myself.)
* get rid of the fancy signs and logos.
* when sorting different paths -- a more elegant way to do it is to use `os.path.join(...)` instead of `"HARD_CODED" / "PATH"` (or something like that). 
* avoiding "ad hoc" name to the specific case (a special material name or simulation name) for the class name when refactoring. Always assume this can generalized to other cases in the future.
* if a code starts with `util_*.py` or alike, the `if __name__ == __main__:` is not necesary as this code just provide the library of function (or class).
* when changing lines -- if you can align the code to the left by some degrees the code always reads better, e.g.,
    this function (or other line-changes)
    ```
    def example_func(ax, graph, node_positions,
                    node_list, box_size, n_points, bounds):
    ```
    looks much more comfortable and better than:
    ```
    def example_func(ax, graph, node_positions,
                node_list, box_size, n_points, bounds):
    ```
* when you see something like:
    ```
        self.eval_dataset = NyeAlpha11Alpha12Dataset2D(
            data_dirs=self.data_dirs, seq_len=seq_len, normalize=True, n_points=n_points,
            step_range=self.step_range, z_slice=z_slice, min_val=self.min_val, max_val=self.max_val,
        )
    ```
I want it to be:
    ```
        self.eval_dataset = NyeAlpha11Alpha12Dataset2D(
            data_dirs=self.data_dirs, seq_len=seq_len, normalize=True, n_points=n_points,
            step_range=self.step_range, z_slice=z_slice, min_val=self.min_val, max_val=self.max_val)
    ```
It may seems minor but make the code much more clean and compact.